/** Firestore path helpers for the single-salon document tree. */

export function salonDocPath(salonId: string): string {
  return `salons/${salonId}`
}

export function bookingSettingsPath(salonId: string): string {
  return `salons/${salonId}/settings/booking`
}

export function homepageSettingsPath(salonId: string): string {
  return `salons/${salonId}/settings/homepage`
}

export function servicesCollectionPath(salonId: string): string {
  return `salons/${salonId}/services`
}

export function serviceDocPath(salonId: string, serviceId: string): string {
  return `salons/${salonId}/services/${serviceId}`
}

export function reservationsCollectionPath(salonId: string): string {
  return `salons/${salonId}/reservations`
}

export function reservationDocPath(salonId: string, reservationId: string): string {
  return `salons/${salonId}/reservations/${reservationId}`
}

export function openingHoursDocPath(salonId: string, weekday: string): string {
  return `salons/${salonId}/openingHours/${weekday}`
}

export function holidaysCollectionPath(salonId: string): string {
  return `salons/${salonId}/holidays`
}

export function dayExceptionsCollectionPath(salonId: string): string {
  return `salons/${salonId}/dayExceptions`
}

export function blockedSlotsCollectionPath(salonId: string): string {
  return `salons/${salonId}/blockedSlots`
}

export function employeesCollectionPath(salonId: string): string {
  return `salons/${salonId}/employees`
}

export function activityLogsCollectionPath(salonId: string): string {
  return `salons/${salonId}/activityLogs`
}
