import { getFirestore } from 'firebase-admin/firestore'
import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https'

export async function assertSignedIn(request: CallableRequest): Promise<string> {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Sign in required.')
  }
  return request.auth.uid
}

export async function assertOperator(request: CallableRequest): Promise<string> {
  const uid = await assertSignedIn(request)
  if (request.auth?.token?.operator !== true) {
    throw new HttpsError('permission-denied', 'Operator access required.')
  }
  return uid
}

export async function assertAdmin(request: CallableRequest): Promise<string> {
  const uid = await assertSignedIn(request)
  if (request.auth?.token?.operator === true) {
    return uid
  }
  const snap = await getFirestore().collection('users').doc(uid).get()
  if (!snap.exists || snap.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Administrator access required.')
  }
  return uid
}

export async function assertPrimaryAdmin(request: CallableRequest): Promise<string> {
  const uid = await assertSignedIn(request)
  if (request.auth?.token?.operator === true) {
    throw new HttpsError(
      'permission-denied',
      'Only the primary salon admin can perform this action.',
    )
  }
  const snap = await getFirestore().collection('users').doc(uid).get()
  if (!snap.exists || snap.data()?.role !== 'admin' || snap.data()?.isPrimaryAdmin !== true) {
    throw new HttpsError('permission-denied', 'Primary salon admin access required.')
  }
  return uid
}

export async function assertEmployee(request: CallableRequest): Promise<string> {
  const uid = await assertSignedIn(request)
  const snap = await getFirestore().collection('users').doc(uid).get()
  if (!snap.exists || snap.data()?.role !== 'employee') {
    throw new HttpsError('permission-denied', 'Employee access required.')
  }
  return uid
}

export async function assertAdminOrEmployeeSelf(
  request: CallableRequest,
  employeeUid: string,
): Promise<string> {
  const uid = await assertSignedIn(request)
  if (request.auth?.token?.operator === true) {
    return uid
  }
  const snap = await getFirestore().collection('users').doc(uid).get()
  const role = snap.exists ? snap.data()?.role : undefined
  if (role === 'admin') {
    return uid
  }
  if (role === 'employee' && uid === employeeUid) {
    return uid
  }
  throw new HttpsError('permission-denied', 'Administrator or own employee access required.')
}
