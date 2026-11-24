import { initializeApp } from 'firebase-admin/app'
import { onCall } from 'firebase-functions/v2/https'

import { getDemoModeStatus, operatorLogin, setDemoMode } from './admin/operator'
import { createEmployeeAccount, createFirstSalonAdmin, getStaffOverview } from './admin/users'
import { assertSignedIn } from './authz'
import {
  adminCancelReservation,
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
  disconnectGoogleCalendar,
  getGoogleCalendarStatus,
  googleCalendarOAuthCallback,
  googleCalendarWebhook,
  selectGoogleCalendar,
  startGoogleCalendarOAuth,
  syncGoogleCalendar,
  syncGoogleCalendarSchedule,
} from './googleCalendar/functions'
import { functionsRegion, getSalonId } from './config'

initializeApp()

export {
  getAvailableSlots,
  createReservation,
  createManualReservation,
  manageReservation,
  cancelReservation,
  rescheduleReservation,
  confirmReservation,
  declineReservation,
  adminCancelReservation,
  completeReservation,
  processPendingReservations,
  processPendingReservationsSchedule,
  operatorLogin,
  getDemoModeStatus,
  setDemoMode,
  getStaffOverview,
  createFirstSalonAdmin,
  createEmployeeAccount,
  getGoogleCalendarStatus,
  startGoogleCalendarOAuth,
  googleCalendarOAuthCallback,
  selectGoogleCalendar,
  syncGoogleCalendar,
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
