# Admin calendar quick actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Calendar entry quick menu (details / edit), full edit via manual form, MUI Dialog cancel confirm on details.

**Architecture:** Menu on calendar click; `/admin/manual?reservationId=` edit mode; new `adminUpdateReservation` callable with lock move; slots accept admin `excludeReservationId`.

**Tech Stack:** React, MUI Menu/Dialog, TanStack Router, Firebase callables, Vitest/node:test, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-18-admin-calendar-quick-actions-design.md`

## Global Constraints

- Layers: routes → pages → components → hooks → data → firebase.
- No new deps; MUI Dialog for confirm (not `window.confirm` for cancel).
- Cancel not in quick menu.
- Commits only if user asks.

## Review Focus

- Editing keeps own slot free (excludeReservationId).
- Changing services recalculates duration/endAt and locks.
- Completed/cancelled cannot update.
- Quick menu has no Stornieren.
- Cancel Dialog requires explicit confirm before mutate.

---

### Task 1: Backend update + slot exclude

**Files:**

- Modify: `functions/src/booking/reservationWrite.ts` (add `updateReservationTransactional` or similar)
- Modify: `functions/src/booking/adminActions.ts` (export `adminUpdateReservation`)
- Modify: `functions/src/booking/getAvailableSlots.ts` (admin `excludeReservationId`)
- Modify: `functions/src/index.ts`
- Test: `functions/adminUpdateReservation.test.js` (emulator or pure lock-id helper + transactional with emulator if available)

- [x] Implement update: load reservation, ACTIVE only, resolve serviceIds, validate slot (exclude self), swap locks, patch fields, keep status/source/token hash.
- [x] Wire callable + slots exclude for admin when `enforceAdvanceRestrictions === false`.
- [x] Test: update changes startAt/serviceIds; inactive status fails.

### Task 2: Client API + hooks + slots

**Files:**

- Modify: `src/data/adminBookingApi.ts`, `src/hooks/useAdminReservations.ts`
- Modify: `src/data/bookingApi.ts`, `src/hooks/useAvailableSlots.ts`

- [x] `updateManualReservationAdmin(...)` callable wrapper.
- [x] `fetchAvailableSlots` / hook accept `excludeReservationId`.

### Task 3: Quick menu + cancel Dialog

**Files:**

- Modify: `src/components/WeekPlanner.tsx`, `src/pages/admin/AdminHomePage.tsx`, `src/routes/admin.tsx`
- Modify: `src/pages/admin/AdminReservationDetailPage.tsx`
- Modify: `src/i18n/messages.ts`

- [x] Entry click → Menu: Details, Umbuchen.
- [x] Detail cancel (and decline) via MUI Dialog.
- [x] i18n keys for menu + dialog copy.

### Task 4: Manual form edit mode

**Files:**

- Modify: `src/pages/admin/AdminManualBookingPage.tsx`, `src/routes/admin.tsx`
- Modify: `e2e/admin.spec.ts` if calendar click path breaks

- [x] Search `reservationId`; load reservation; prefill services/date/time/customer/note.
- [x] Submit → update mutation; title/button copy for edit.
- [x] Slots with `excludeReservationId`.
- [x] `pnpm typecheck`, `pnpm lint`, unit + targeted e2e.

## Execution

Native / executing-plans in this session (user approved design + “ja bitte”). Skip git commits unless asked.
