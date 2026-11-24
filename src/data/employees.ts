import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import * as v from 'valibot'

import { firestore } from '../firebase'
import { getSalonId } from './salonConfig'
import { employeesCollectionPath } from './salonPaths'
import { employeeSchema, type Employee } from './schemas'

export type EmployeeWithId = Employee & { id: string }

export async function fetchActiveEmployees(): Promise<EmployeeWithId[]> {
  const salonId = getSalonId()
  const snap = await getDocs(
    query(
      collection(firestore, employeesCollectionPath(salonId)),
      where('active', '==', true),
      orderBy('displayName', 'asc'),
    ),
  )

  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...v.parse(employeeSchema, docSnap.data()),
  }))
}
