# Admin manual multi-service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins pick multiple services on the manual booking page; slots and create use combined duration/`serviceIds` like online booking, on one fast screen.

**Architecture:** Keep `AdminManualBookingPage` (no customer wizard). Checkbox list + URL `serviceIds`. Wire `createManualReservation` through existing `resolveServiceIds`. Reuse `groupServicesByCategory` / slot hooks.

**Tech Stack:** React + MUI, TanStack Router search params, Firebase callable, Vitest / node:test, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-18-admin-manual-multi-service-design.md`

## Global Constraints

- Layers: `routes → pages → components → hooks → data → firebase.ts`.
- No new dependencies.
- Max 15 services (same as online).
- Active services only; `enforceAdvanceRestrictions: false` for manual.
- Do not reuse `BookingWizardPage`.

## Review Focus

- Legacy `?serviceId=` links still select one service.
- Toggling services clears picked time (duration changed) but keeps day.
- Empty selection: no slots, submit disabled.
- Manual create with two services stores `serviceIds` + summed duration.
- E2E “admin can create a manual reservation” still passes with checkbox UI.

---

### Task 1: Backend `createManualReservation` accepts `serviceIds`

**Files:**

- Modify: `functions/src/booking/createReservation.ts`
- Test: `functions/resolveServiceIds.test.js` (or extend an existing functions test)

**Interfaces:**

- Produces: `createManualReservation` uses `resolveServiceIds(data)` → `{ serviceId, serviceIds }` passed into `createReservationTransactional`.

- [x] **Step 1:** Add failing test: `resolveServiceIds({ serviceIds: ['a','b'] })` → `{ serviceId: 'a', serviceIds: ['a','b'] }`; `{ serviceId: 'x' }` → single-element list. Export `resolveServiceIds` for the test (or move to a tiny shared helper in `functions/src/booking/`).
- [x] **Step 2:** Run test — expect FAIL / missing export.
- [x] **Step 3:** Wire `createManualReservation` to `resolveServiceIds` (drop sole `requireString(data.serviceId)`).
- [x] **Step 4:** Test PASS.
- [ ] **Step 5:** Commit `fix(functions): accept serviceIds on manual create` (skipped until asked)

### Task 2: Shared URL service-id parse/serialize + client API

**Files:**

- Create: `src/data/serviceSelection.ts`, `src/data/serviceSelection.test.ts`
- Modify: `src/data/adminBookingApi.ts`, `src/hooks/useAdminReservations.ts` (types only if needed)
- Modify: `src/routes/book.tsx` to import parse/serialize (optional DRY; if book change is noisy, duplicate parse in admin only — prefer extract)

**Interfaces:**

- Produces:
  - `parseSelectedServiceIds(search: { serviceId?: string; serviceIds?: string }): string[]`
  - `serializeServiceIds(ids: string[]): string | undefined`
  - `createManualReservationAdmin(input: { serviceIds: string[]; serviceId?: string; … })`

- [x] **Step 1:** Failing unit tests for parse (`serviceIds=a,b`, legacy `serviceId`, dedupe) and serialize.
- [x] **Step 2:** Implement helpers + update `createManualReservationAdmin` to send `serviceIds` (and `serviceId: ids[0]` for older backends).
- [x] **Step 3:** `pnpm test` for the new file PASS.
- [ ] **Step 4:** Commit `feat: parse serviceIds for admin manual booking` (skipped until asked)

### Task 3: Admin route + page UI

**Files:**

- Modify: `src/routes/admin.tsx` (`manualSearchSchema`, `AdminManualRoute`)
- Modify: `src/pages/admin/AdminManualBookingPage.tsx`
- Modify: `src/i18n/messages.ts` only if book keys are wrong for admin

**Interfaces:**

- Page props: `selectedServiceIds: string[]`, `onToggleService: (id: string) => void`, `onSubmit` with `serviceIds: string[]`.
- Route: `useAvailableSlots({ serviceIds: selectedServiceIds, … })`; navigate with `serviceIds: serializeServiceIds(...)`.

- [x] **Step 1:** Replace dropdown with category checkbox list (pattern from `BookingWizardPage` step 1, denser ok). Summary: `t('book.selectedServicesCount')` + `t('book.totalDuration')`.
- [x] **Step 2:** Toggle clears local `pickedStartAt`; keep `date` in URL.
- [x] **Step 3:** Typecheck/lint clean for touched files.
- [ ] **Step 4:** Commit `feat(admin): multi-select services on manual booking` (skipped until asked)

### Task 4: E2E + verify

**Files:**

- Modify: `e2e/admin.spec.ts` (`admin can create a manual reservation`)

- [x] **Step 1:** Replace `getByLabel('Leistung')` + option click with checkbox/button press for at least one service (ideally two if seed has ≥2 active).
- [x] **Step 2:** Run `pnpm test:e2e:smoke` or the admin spec; expect PASS.
- [x] **Step 3:** `pnpm typecheck` + `pnpm test` (unit) PASS.
- [ ] **Step 4:** Commit `test(e2e): manual booking multi-service selection` (skipped until asked)

## Execution

User approved design + asked for plan then build → **native / executing-plans** in this session (no per-task subagents). Commits only if the user asks; otherwise leave changes unstaged unless plan steps say commit — **Ruling:** repo user rule says only commit when asked → skip commit steps until asked; still do all code/test steps.
