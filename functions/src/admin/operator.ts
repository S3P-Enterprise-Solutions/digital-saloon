import { createHash, timingSafeEqual } from 'node:crypto'

import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'

import { assertOperator } from '../authz'
import { functionsRegion, getDefaultTimezone, getOperatorCredentials, getSalonId } from '../config'
import { recordActivityLog } from '../logging/activityLog'
import { isObject } from '../schemas'
import {
  buildDemoReservations,
  DEMO_RESERVATION_FLAG,
  type DemoServiceInput,
} from './demoReservations'

function safeEqual(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest()
  const hashB = createHash('sha256').update(b).digest()
  return timingSafeEqual(hashA, hashB)
}

export const operatorLogin = onCall({ region: functionsRegion }, async (request) => {
  const data = request.data
  if (!isObject(data)) {
    throw new HttpsError('invalid-argument', 'Invalid payload.')
  }
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : ''
  const password = typeof data.password === 'string' ? data.password : ''
  const expected = getOperatorCredentials()
  if (!expected) {
    throw new HttpsError('failed-precondition', 'Operator login is not configured.')
  }

  if (
    !email ||
    !password ||
    !safeEqual(email, expected.email) ||
    !safeEqual(password, expected.password)
  ) {
    await recordActivityLog({
      request,
      action: 'admin_login_failed',
      source: 'server',
      path: '/login',
      details: { method: 'operator' },
    })
    throw new HttpsError('unauthenticated', 'Invalid operator credentials.')
  }

  const token = await getAuth().createCustomToken('operator-admin', {
    operator: true,
    role: 'admin',
  })

  await recordActivityLog({
    request,
    action: 'admin_login',
    source: 'server',
    path: '/login',
    actorOverride: {
      actorType: 'operator',
      actorUid: 'operator-admin',
      actorEmail: email,
    },
    details: { method: 'operator' },
  })

  return { token }
})

export const getDemoModeStatus = onCall({ region: functionsRegion }, async (request) => {
  await assertOperator(request)
  const db = getFirestore()
  const salonId = getSalonId()
  const snap = await db.collection('salons').doc(salonId).collection('settings').doc('demo').get()
  return { enabled: Boolean(snap.data()?.enabled) }
})

export const setDemoMode = onCall({ region: functionsRegion }, async (request) => {
  await assertOperator(request)
  const data = request.data
  if (!isObject(data) || typeof data.enabled !== 'boolean') {
    throw new HttpsError('invalid-argument', 'enabled (boolean) is required.')
  }

  const db = getFirestore()
  const salonId = getSalonId()
  const salonRef = db.collection('salons').doc(salonId)
  const reservationsRef = salonRef.collection('reservations')

  // Remove any existing demo reservations first
  const existingDemo = await reservationsRef.where(DEMO_RESERVATION_FLAG, '==', true).get()
  for (let i = 0; i < existingDemo.docs.length; i += 400) {
    const batch = db.batch()
    for (const docSnap of existingDemo.docs.slice(i, i + 400)) {
      batch.delete(docSnap.ref)
    }
    await batch.commit()
  }

  if (data.enabled) {
    const [salonSnap, servicesSnap] = await Promise.all([
      salonRef.get(),
      salonRef.collection('services').where('active', '==', true).get(),
    ])
    const timeZone = String(salonSnap.data()?.timezone ?? getDefaultTimezone())
    const services: DemoServiceInput[] = servicesSnap.docs.map((docSnap) => {
      const s = docSnap.data()
      return {
        id: docSnap.id,
        nameDe: String(s.nameDe ?? s.name ?? 'Service'),
        nameIt: String(s.nameIt ?? s.name ?? 'Servizio'),
        durationMinutes: Number(s.durationMinutes ?? 30),
        priceCents: Number(s.priceCents ?? 2500),
      }
    })

    const demoEntries = buildDemoReservations({
      now: new Date(),
      timeZone,
      services,
    })

    for (let i = 0; i < demoEntries.length; i += 400) {
      const batch = db.batch()
      for (const entry of demoEntries.slice(i, i + 400)) {
        batch.set(reservationsRef.doc(entry.id), entry.data)
      }
      await batch.commit()
    }
  }

  await salonRef.collection('settings').doc('demo').set({
    enabled: data.enabled,
    updatedAt: new Date().toISOString(),
  })

  await recordActivityLog({
    request,
    action: 'admin_demo_mode_toggled',
    source: 'server',
    path: '/admin/settings',
    details: { enabled: data.enabled },
    db,
    salonId,
  })

  return { enabled: data.enabled }
})
