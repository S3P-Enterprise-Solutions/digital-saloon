import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'

import { assertAdmin, assertOperator, assertPrimaryAdmin } from '../authz'
import { functionsRegion, getSalonId, isEmployeeManagementEnabled } from '../config'
import { isObject } from '../schemas'

export function assertEmployeeManagementFeatureEnabled(): void {
  if (!isEmployeeManagementEnabled()) {
    throw new HttpsError('failed-precondition', 'Employee management is not enabled for this salon.')
  }
}

export function validateEmployeeAccountInput(data: unknown): {
  email: string
  password: string
  firstName: string
  lastName: string
  displayName: string
} {
  if (!isObject(data)) {
    throw new HttpsError('invalid-argument', 'Invalid payload.')
  }
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : ''
  const password = typeof data.password === 'string' ? data.password : ''
  const firstName = typeof data.firstName === 'string' ? data.firstName.trim() : ''
  const lastName = typeof data.lastName === 'string' ? data.lastName.trim() : ''

  if (!email || !email.includes('@')) {
    throw new HttpsError('invalid-argument', 'Valid email is required.')
  }
  if (password.length < 8) {
    throw new HttpsError('invalid-argument', 'Password must be at least 8 characters.')
  }
  if (!firstName || firstName.length > 80) {
    throw new HttpsError('invalid-argument', 'First name is required (max 80 characters).')
  }
  if (!lastName || lastName.length > 80) {
    throw new HttpsError('invalid-argument', 'Last name is required (max 80 characters).')
  }

  const displayName = `${firstName} ${lastName}`.trim()
  if (displayName.length > 80) {
    throw new HttpsError('invalid-argument', 'Display name is too long (max 80 characters).')
  }

  return { email, password, firstName, lastName, displayName }
}

export function buildEmployeeUserDocument(input: {
  email: string
  displayName: string
  createdAt: string
}): {
  email: string
  displayName: string
  role: 'employee'
  createdAt: string
} {
  return {
    email: input.email,
    displayName: input.displayName,
    role: 'employee',
    createdAt: input.createdAt,
  }
}

export function buildEmployeeSalonDocument(input: {
  email: string
  firstName: string
  lastName: string
  displayName: string
  createdAt: string
}): {
  firstName: string
  lastName: string
  displayName: string
  email: string
  active: true
  authDisabled: false
  serviceIds: []
  createdAt: string
  updatedAt: string
} {
  return {
    firstName: input.firstName,
    lastName: input.lastName,
    displayName: input.displayName,
    email: input.email,
    active: true,
    authDisabled: false,
    serviceIds: [],
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  }
}

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

export type StaffOverviewMember = {
  uid: string
  email: string
  displayName: string
  isPrimaryAdmin: boolean
  createdAt: string
}

export function buildStaffOverviewResponse(staff: StaffOverviewMember[]): {
  hasPrimaryAdmin: boolean
  staff: StaffOverviewMember[]
} {
  return {
    hasPrimaryAdmin: staff.some((member) => member.isPrimaryAdmin),
    staff,
  }
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
  return buildStaffOverviewResponse(staff)
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
  assertEmployeeManagementFeatureEnabled()
  const { email, password, firstName, lastName, displayName } = validateEmployeeAccountInput(
    request.data,
  )
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
  const userDoc = buildEmployeeUserDocument({ email, displayName, createdAt })
  const employeeDoc = buildEmployeeSalonDocument({
    email,
    firstName,
    lastName,
    displayName,
    createdAt,
  })

  await db.collection('users').doc(uid).set(userDoc)
  await db.collection('salons').doc(getSalonId()).collection('employees').doc(uid).set(employeeDoc)

  return { uid, email, displayName, firstName, lastName, role: 'employee' as const, createdAt }
})
