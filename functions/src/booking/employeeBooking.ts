import type { BookingCandidateEmployee } from './salonContext'

export {
  coversRequestedServices,
  isBookingCandidateRecord,
  isEmployeeAllowedForServices,
} from './salonContext'

export type BookingEmployeeTarget =
  { ok: true; employeeIds: Array<string | null> } | { ok: false; code: 'NOT_FOUND' }

export function resolveEmployeeIdsToCheck(input: {
  featureEnabled: boolean
  candidates: readonly BookingCandidateEmployee[]
  requestedEmployeeId: string | null
  /**
   * When false (the salon has no active bookable employees configured yet) and no
   * specific employee was requested, fall back to salon-level booking (`[null]`).
   */
  hasAnyBookableEmployee?: boolean
}): BookingEmployeeTarget {
  if (!input.featureEnabled) {
    return { ok: true, employeeIds: [null] }
  }
  if (input.requestedEmployeeId) {
    const matched = input.candidates.find((emp) => emp.id === input.requestedEmployeeId)
    if (!matched) {
      return { ok: false, code: 'NOT_FOUND' }
    }
    return { ok: true, employeeIds: [matched.id] }
  }
  if (input.candidates.length === 0) {
    if (input.hasAnyBookableEmployee === false) {
      return { ok: true, employeeIds: [null] }
    }
    return { ok: true, employeeIds: [] }
  }
  return { ok: true, employeeIds: input.candidates.map((emp) => emp.id) }
}
