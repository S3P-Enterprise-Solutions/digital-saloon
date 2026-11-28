import { initializeApp } from 'firebase-admin/app'
import { onCall } from 'firebase-functions/v2/https'

import { getDemoModeStatus, operatorLogin, setDemoMode } from './admin/operator'
import {
  createEmployeeProfileForAdmin,
  deleteEmployeeDayException,
  listBookableEmployees,
  listMyEmployeeReservations,
  saveEmployeeDayException,
  saveEmployeeWorkingHours,
  setEmployeeAuthDisabled,
  setEmployeeBookable,
  setEmployeePassword,
  softRemoveEmployee,
  updateEmployeeProfile,
} from './admin/employees'
import { createEmployeeAccount, createFirstSalonAdmin, getStaffOverview } from './admin/users'
import { assertSignedIn } from './authz'
import {
  adminCancelReservation,
  adminUpdateReservation,
  completeReservation,
  confirmReservation,
  declineReservation,
} from './booking/adminActions'
import { createManualReservation, createReservation } from './booking/createReservation'
import {
  cancelReservation,
  manageReservation,
  rescheduleReservation,
} from './booking/customerActions'
import {
  processPendingReservations,
  processPendingReservationsSchedule,
} from './booking/processPendingReservations'
import { getAvailableSlots } from './booking/getAvailableSlots'
import {
  archiveCustomer,
  getCustomerDetail,
  listCustomers,
  saveCustomer,
} from './customers/functions'
import {
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  getGoogleCalendarStatus,
  googleCalendarWebhook,
  importGoogleCalendarHistory,
  listBlockedSlotsInRange,
  setBlockedSlotPrivacy,
  syncGoogleCalendar,
  syncGoogleCalendarSchedule,
} from './googleCalendar/functions'
import { functionsRegion, getSalonId } from './config'
import { logActivity } from './logging/activityLog'

initializeApp()

export {
  logActivity,
  getAvailableSlots,
  createReservation,
  createManualReservation,
  manageReservation,
  cancelReservation,
  rescheduleReservation,
  confirmReservation,
  declineReservation,
  adminCancelReservation,
  adminUpdateReservation,
  completeReservation,
  processPendingReservations,
  processPendingReservationsSchedule,
  operatorLogin,
  getDemoModeStatus,
  setDemoMode,
  getStaffOverview,
  createFirstSalonAdmin,
  createEmployeeAccount,
  createEmployeeProfileForAdmin,
  updateEmployeeProfile,
  setEmployeeBookable,
  setEmployeeAuthDisabled,
  setEmployeePassword,
  softRemoveEmployee,
  saveEmployeeWorkingHours,
  saveEmployeeDayException,
  deleteEmployeeDayException,
  listBookableEmployees,
  listMyEmployeeReservations,
  listCustomers,
  getCustomerDetail,
  saveCustomer,
  archiveCustomer,
  getGoogleCalendarStatus,
  connectGoogleCalendar,
  syncGoogleCalendar,
  importGoogleCalendarHistory,
  listBlockedSlotsInRange,
  setBlockedSlotPrivacy,
  disconnectGoogleCalendar,
  googleCalendarWebhook,
  syncGoogleCalendarSchedule,
}

/**
 * Health/auth smoke callable. Always re-check authorization — Admin SDK bypasses rules.
 */
export const ping = onCall({ region: functionsRegion }, async (request) => {
  const uid = await assertSignedIn(request)

  return {
    ok: true as const,
    uid,
    salonId: getSalonId(),
    at: new Date().toISOString(),
  }
})
