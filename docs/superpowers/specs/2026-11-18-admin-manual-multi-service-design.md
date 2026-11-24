# Admin manual booking: multi-service selection

**Status:** approved  
**Date:** 2026-11-18

## Intent

When creating a manual appointment, the hairdresser can select several services in one go. Goal: less work and less time than today — not a second booking wizard.

## Goals

- Pick multiple active services on the existing admin manual page (one screen).
- Slot list uses combined duration (same rules as online booking).
- Save creates one reservation with `serviceIds` (source `MANUAL`).
- Stay fast: few taps, clear total duration, no extra steps.

## Non-goals

- Reusing `BookingWizardPage` or a 2-step customer wizard in admin.
- Selecting inactive services.
- Changing online booking UX.
- Extracting a large shared “booking engine” UI.

## Approaches considered

1. **Reuse full customer wizard in admin** — rejected: privacy, required email, two steps, wrong copy; many conditionals.
2. **Compact MUI multi-select only** — rejected: harder to scan duration/price while working at the desk.
3. **Admin-optimized checkbox list on the current manual page** (chosen) — same selection idea as online, kept in the single admin form.

## Design (chosen)

### UX (admin-optimized)

- Replace the single service dropdown with a scannable checkbox list of **active** services, grouped by category (reuse `groupServicesByCategory` + name/duration helpers from `serviceForm`).
- Keep **day + time + customer fields on the same page** (no step change).
- Show a short live summary under the list: `{count} gewählt · {minutes} Min` (and optional price sum if prices are visible for the salon).
- Changing the selection clears the picked time (duration changed) but keeps the selected day when possible.
- Coming from the week planner: keep preselected `time` when the slot still exists for the new duration; otherwise clear.
- Empty selection: no time slots; submit disabled.

### URL state

- Prefer `serviceIds` as comma-separated ids (same serialization as `/book`).
- Still accept legacy `serviceId` (map to a one-element list) so old links keep working.
- Day/time search params unchanged (`date`, `time`).

### Data / API

- `useAvailableSlots({ serviceIds, …, enforceAdvanceRestrictions: false })`.
- Client `createManualReservationAdmin` accepts `serviceIds: string[]` (keep `serviceId` as first id for compatibility if needed).
- Cloud Function `createManualReservation` uses existing `resolveServiceIds` (same as online `createReservation`).

### Tests

- Callable/unit: manual create with multiple `serviceIds` stores combined duration/`serviceIds`.
- UI or route-level coverage only if cheap; otherwise extend existing admin manual path lightly.

## Builder calls

- Do **not** share the full wizard component; copy the selection interaction pattern into `AdminManualBookingPage` (small local UI is fine; extract a tiny presentational helper only if it stays under ~80 lines and has no booking-wizard deps).
- i18n: reuse existing `book.selectedServicesCount` / `book.totalDuration` where wording fits; add admin keys only if needed.
- Max 15 services (same server limit as online).
