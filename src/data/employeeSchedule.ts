import { collection, getDocs } from 'firebase/firestore'
import * as v from 'valibot'

import { firestore } from '../firebase'
import type { OpeningHoursByWeekday } from './openingHours'
import { getSalonId } from './salonConfig'
import { employeeDayExceptionsCollectionPath } from './salonPaths'
import { dayExceptionSchema, openingHoursSchema, weekdaySchema, type DayException } from './schemas'

export type EmployeeWorkingHoursByWeekday = OpeningHoursByWeekday

export type EmployeeDayExceptionWithId = DayException & { id: string }

export async function fetchEmployeeWorkingHours(
  employeeUid: string,
): Promise<EmployeeWorkingHoursByWeekday> {
  const salonId = getSalonId()
  const snap = await getDocs(
    collection(firestore, `salons/${salonId}/employees/${employeeUid}/workingHours`),
  )
  const result = {} as EmployeeWorkingHoursByWeekday
  for (const docSnap of snap.docs) {
    const weekday = v.parse(weekdaySchema, docSnap.id)
    result[weekday] = v.parse(openingHoursSchema, docSnap.data())
  }
  return result
}

export async function fetchEmployeeDayExceptions(
  employeeUid: string,
): Promise<EmployeeDayExceptionWithId[]> {
  const salonId = getSalonId()
  const snap = await getDocs(
    collection(firestore, employeeDayExceptionsCollectionPath(salonId, employeeUid)),
  )
  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...v.parse(dayExceptionSchema, docSnap.data()),
  }))
}
