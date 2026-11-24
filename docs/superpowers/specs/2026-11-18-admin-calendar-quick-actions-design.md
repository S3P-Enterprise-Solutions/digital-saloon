# Admin calendar quick actions + full edit

**Status:** approved  
**Date:** 2026-11-18

## Intent

Hairdresser taps a calendar entry and gets a fast menu: open details or edit everything. Cancel stays behind details with an explicit MUI confirm dialog.

## Goals

- Calendar entry click → Menu: **Details anzeigen**, **Umbuchen** (no cancel).
- Umbuchen opens the existing manual booking form in edit mode; all fields editable (services, day/time, customer, internal note).
- Details page: cancel only there; **MUI Dialog** confirmation (also for decline if still using confirm).
- Backend `adminUpdateReservation` updates active (PENDING/CONFIRMED) reservations atomically with slot locks.

## Non-goals

- Cancel from the quick menu.
- Drag-and-drop on the calendar.
- Customer-facing changes.
- Replacing create flow.

## Approaches

1. **Popover/Menu + edit mode on manual form + adminUpdateReservation** (chosen).
2. Time-only reschedule — rejected (need full edit).
3. Separate edit dialog — rejected (duplicate form).

## Design

### Quick menu

- `WeekPlanner` / home: click entry opens MUI `Menu` anchored to the entry.
- Actions: Details → `/admin/reservations/$id`; Umbuchen → `/admin/manual?reservationId=$id` (plus prefills via loaded reservation).

### Edit form

- Extend `AdminManualBookingPage` with optional edit initial values / mode.
- Route loads reservation when `reservationId` present; submit calls update API.
- Slot fetch excludes current reservation (admin `excludeReservationId`) while using **selected** services’ duration.

### Cancel dialog

- `AdminReservationDetailPage`: MUI `Dialog` for cancel confirm; remove `window.confirm` for cancel (and decline for consistency).

### API

- `adminUpdateReservation({ reservationId, serviceIds, startAt, firstName, lastName, phone, email, internalNote })`.
- Only PENDING/CONFIRMED; resolve services; move/replace slot lock; keep status/source/managementTokenHash.
