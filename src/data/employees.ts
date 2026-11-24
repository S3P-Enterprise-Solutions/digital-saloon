import { collection, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore'
import * as v from 'valibot'

import { firestore } from '../firebase'
import { getSalonId } from './salonConfig'
import { employeesCollectionPath } from './salonPaths'
import { employeeSchema, type Employee } from './schemas'

export type EmployeeWithId = Employee & { id: string }

function employeeFromFirestoreDoc(id: string, data: Record<string, unknown>): EmployeeWithId {
  const parsed = v.safeParse(employeeSchema, data)
  if (parsed.success) {
    return { id, ...parsed.output }
  }

  const displayName = typeof data.displayName === 'string' ? data.displayName.trim() : 'Admin'
  const nameParts = displayName.split(/\s+/).filter(Boolean)
  const firstName =
    typeof data.firstName === 'string' && data.firstName.trim()
      ? data.firstName.trim()
      : (nameParts[0] ?? displayName)
  const lastName =
    typeof data.lastName === 'string' && data.lastName.trim()
      ? data.lastName.trim()
      : nameParts.slice(1).join(' ') || '—'
  const createdAt = typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()
  const updatedAt = typeof data.updatedAt === 'string' ? data.updatedAt : createdAt

  return {
    id,
    firstName,
    lastName,
    displayName,
    email: typeof data.email === 'string' ? data.email : '',
    photoUrl: data.photoUrl === null || typeof data.photoUrl === 'string' ? data.photoUrl : null,
    active: data.active === true,
    authDisabled: data.authDisabled === true,
    serviceIds: Array.isArray(data.serviceIds)
      ? data.serviceIds.filter((item): item is string => typeof item === 'string')
      : [],
    createdAt,
    updatedAt,
    removedAt:
      data.removedAt === null || typeof data.removedAt === 'string' ? data.removedAt : undefined,
  }
}

export async function fetchEmployeeByUid(employeeUid: string): Promise<EmployeeWithId | null> {
  const salonId = getSalonId()
  const snapshot = await getDoc(doc(firestore, employeesCollectionPath(salonId), employeeUid))
  if (!snapshot.exists()) return null
  return employeeFromFirestoreDoc(snapshot.id, snapshot.data())
}

export async function fetchActiveEmployees(): Promise<EmployeeWithId[]> {
  const salonId = getSalonId()
  const snap = await getDocs(
    query(
      collection(firestore, employeesCollectionPath(salonId)),
      where('active', '==', true),
      orderBy('displayName', 'asc'),
    ),
  )

  return snap.docs.map((docSnap) => employeeFromFirestoreDoc(docSnap.id, docSnap.data()))
}

/** Full employee list for admin UI (includes inactive and removed). */
export async function fetchEmployees(): Promise<EmployeeWithId[]> {
  const salonId = getSalonId()
  const snap = await getDocs(
    query(collection(firestore, employeesCollectionPath(salonId)), orderBy('displayName', 'asc')),
  )

  return snap.docs.map((docSnap) => employeeFromFirestoreDoc(docSnap.id, docSnap.data()))
}
