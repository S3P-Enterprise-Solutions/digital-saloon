import { getFirestore, type Firestore } from 'firebase-admin/firestore'

import type {
  BookingSettingsInput,
  BusyInterval,
  DayException,
  Holiday,
  OpeningHoursByWeekday,
  TimeInterval,
  Weekday,
} from '../domain/types'
import { getSalonId } from '../config'

const WEEKDAYS: Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

const BLOCKING_STATUSES = new Set(['PENDING', 'CONFIRMED'])

export type SalonContext = {
  salonId: string
  salonName: string
  salonAddress: string
  salonPhone: string
  timeZone: string
  weekly: OpeningHoursByWeekday
  holidays: Holiday[]
  dayExceptions: DayException[]
  settings: BookingSettingsInput & {
    confirmationMode: 'AUTOMATIC' | 'MANUAL'
    pendingExpirationHours: number
  }
}

export async function loadSalonContext(
  db: Firestore = getFirestore(),
  salonId: string = getSalonId(),
): Promise<SalonContext> {
  const salonRef = db.collection('salons').doc(salonId)
  const salonSnap = await salonRef.get()
  const salonData = salonSnap.exists ? (salonSnap.data() ?? {}) : {}
  const timeZone = String(salonData.timezone ?? 'Europe/Vienna')
  const salonName = String(salonData.name ?? 'SalonFlow')
  const salonAddress = String(salonData.address ?? '')
  const salonPhone = String(salonData.phone ?? '')

  const [settingsSnap, hoursSnap, holidaysSnap, exceptionsSnap] = await Promise.all([
    salonRef.collection('settings').doc('booking').get(),
    salonRef.collection('openingHours').get(),
    salonRef.collection('holidays').get(),
    salonRef.collection('dayExceptions').get(),
  ])

  const settingsData = settingsSnap.data() ?? {}
  const weekly = {} as OpeningHoursByWeekday
  for (const weekday of WEEKDAYS) {
    weekly[weekday] = []
  }
  for (const doc of hoursSnap.docs) {
    const weekday = doc.id as Weekday
    const intervals = (doc.data().intervals ?? []) as TimeInterval[]
    weekly[weekday] = intervals
  }

  return {
    salonId,
    salonName,
    salonAddress,
    salonPhone,
    timeZone,
    weekly,
    holidays: holidaysSnap.docs.map((doc) => ({
      startDate: String(doc.data().startDate),
      endDate: String(doc.data().endDate),
    })),
    dayExceptions: exceptionsSnap.docs.map((doc) => ({
      date: String(doc.data().date),
      intervals: (doc.data().intervals ?? []) as TimeInterval[],
      closed: Boolean(doc.data().closed),
    })),
    settings: {
      confirmationMode: settingsData.confirmationMode === 'MANUAL' ? 'MANUAL' : 'AUTOMATIC',
      slotIntervalMinutes: Number(settingsData.slotIntervalMinutes ?? 15),
      minAdvanceBookingMinutes: Number(settingsData.minAdvanceBookingMinutes ?? 0),
      maxAdvanceBookingDays: Number(settingsData.maxAdvanceBookingDays ?? 60),
      pendingExpirationHours: Number(settingsData.pendingExpirationHours ?? 24),
    },
  }
}

export type ActiveEmployee = {
  id: string
  displayName: string
}

export async function loadActiveEmployees(
  db: Firestore,
  salonId: string,
): Promise<ActiveEmployee[]> {
  const snap = await db
    .collection('salons')
    .doc(salonId)
    .collection('employees')
    .where('active', '==', true)
    .get()
  return snap.docs
    .map((doc) => ({
      id: doc.id,
      displayName: String(doc.data().displayName ?? '').trim() || doc.id,
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
}

export async function loadBusyIntervals(
  db: Firestore,
  salonId: string,
  rangeStart: Date,
  rangeEnd: Date,
  excludeReservationId?: string,
  employeeId?: string | null,
): Promise<BusyInterval[]> {
  const salonRef = db.collection('salons').doc(salonId)
  const [reservationsSnap, blocksSnap] = await Promise.all([
    salonRef.collection('reservations').where('startAt', '<', rangeEnd.toISOString()).get(),
    salonRef.collection('blockedSlots').where('startAt', '<', rangeEnd.toISOString()).get(),
  ])

  const busy: BusyInterval[] = []

  for (const doc of reservationsSnap.docs) {
    if (excludeReservationId && doc.id === excludeReservationId) continue
    const data = doc.data()
    if (!BLOCKING_STATUSES.has(String(data.status))) continue
    if (employeeId && data.employeeId && String(data.employeeId) !== employeeId) continue
    const startAt = new Date(String(data.startAt))
    const endAt = new Date(String(data.endAt))
    if (endAt.getTime() <= rangeStart.getTime()) continue
    busy.push({ startAt, endAt })
  }

  for (const doc of blocksSnap.docs) {
    const data = doc.data()
    if (employeeId && data.employeeId && String(data.employeeId) !== employeeId) continue
    const startAt = new Date(String(data.startAt))
    const endAt = new Date(String(data.endAt))
    if (endAt.getTime() <= rangeStart.getTime()) continue
    busy.push({ startAt, endAt })
  }

  return busy
}
