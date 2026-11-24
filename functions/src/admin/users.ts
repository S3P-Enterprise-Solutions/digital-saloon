import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'

import { assertAdmin, assertOperator, assertPrimaryAdmin } from '../authz'
import { functionsRegion, getSalonId } from '../config'
import { isObject } from '../schemas'

function validateNewAccountInput(data: unknown): {
  email: string
  password: string
  displayName: string
} {
  if (!isObject(data)) {
    throw new HttpsError('invalid-argument', 'Invalid payload.')
  }
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : ''
  const password = typeof data.password === 'string' ? data.password : ''
  const displayName = typeof data.displayName === 'string' ? data.displayName.trim() : ''

  if (!email || !email.includes('@')) {
    throw new HttpsError('invalid-argument', 'Valid email is required.')
  }
  if (password.length < 8) {
    throw new HttpsError('invalid-argument', 'Password must be at least 8 characters.')
  }
  if (!displayName || displayName.length > 80) {
    throw new HttpsError('invalid-argument', 'Display name is required (max 80 characters).')
  }
  return { email, password, displayName }
}

export const getStaffOverview = onCall({ region: functionsRegion }, async (request) => {
  await assertAdmin(request)
  const snap = await getFirestore().collection('users').where('role', '==', 'admin').get()
  const staff = snap.docs.map((docSnap) => {
    const d = docSnap.data()
    return {
      uid: docSnap.id,
      email: String(d.email ?? ''),
      displayName: String(d.displayName ?? ''),
      isPrimaryAdmin: d.isPrimaryAdmin === true,
      createdAt: String(d.createdAt ?? ''),
    }
  })
  const db = getFirestore()
  const salonId = getSalonId()
  const empCol = db.collection('salons').doc(salonId).collection('employees')
  const existingEmps = await empCol.get()
  const existingIds = new Set(existingEmps.docs.map((d) => d.id))
  for (const member of staff) {
    if (!existingIds.has(member.uid)) {
      await empCol.doc(member.uid).set({
        displayName: member.displayName,
        active: true,
        createdAt: member.createdAt || new Date().toISOString(),
      })
    }
  }
  return {
    hasPrimaryAdmin: staff.some((member) => member.isPrimaryAdmin),
    staff,
  }
})

export const createFirstSalonAdmin = onCall({ region: functionsRegion }, async (request) => {
  await assertOperator(request)
  const { email, password, displayName } = validateNewAccountInput(request.data)
  const db = getFirestore()

  const lockRef = db.collection('system').doc('primaryAdmin')
  const [lockSnap, existingPrimary] = await Promise.all([
    lockRef.get(),
    db
      .collection('users')
      .where('role', '==', 'admin')
      .where('isPrimaryAdmin', '==', true)
      .limit(1)
      .get(),
  ])

  if (lockSnap.exists || !existingPrimary.empty) {
    throw new HttpsError('failed-precondition', 'Primary salon admin already exists.')
  }

  let uid: string
  try {
    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName,
    })
    uid = userRecord.uid
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create user.'
    throw new HttpsError('already-exists', message)
  }

  const createdAt = new Date().toISOString()
  try {
    await db.runTransaction(async (tx) => {
      const currentLock = await tx.get(lockRef)
      if (currentLock.exists) {
        throw new HttpsError('failed-precondition', 'Primary salon admin already exists.')
      }
      tx.set(lockRef, { uid, createdAt })
      tx.set(db.collection('users').doc(uid), {
        email,
        displayName,
        role: 'admin',
        isPrimaryAdmin: true,
        createdAt,
      })
      tx.set(db.collection('salons').doc(getSalonId()).collection('employees').doc(uid), {
        displayName,
        active: true,
        createdAt,
      })
    })
  } catch (error: unknown) {
    await getAuth()
      .deleteUser(uid)
      .catch(() => undefined)
    throw error
  }

  return { uid, email, displayName, isPrimaryAdmin: true, createdAt }
})

export const createEmployeeAccount = onCall({ region: functionsRegion }, async (request) => {
  await assertPrimaryAdmin(request)
  const { email, password, displayName } = validateNewAccountInput(request.data)
  const db = getFirestore()

  let uid: string
  try {
    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName,
    })
    uid = userRecord.uid
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create user.'
    throw new HttpsError('already-exists', message)
  }

  const createdAt = new Date().toISOString()
  await db.collection('users').doc(uid).set({
    email,
    displayName,
    role: 'admin',
    isPrimaryAdmin: false,
    createdAt,
  })
  await db.collection('salons').doc(getSalonId()).collection('employees').doc(uid).set({
    displayName,
    active: true,
    createdAt,
  })

  return { uid, email, displayName, isPrimaryAdmin: false, createdAt }
})
