# Employee Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optional multi-stylist employee management (accounts, hours, services, booking assignment) gated by brand `features.employeeManagement`, without changing existing admin roles or salon-only booking when the flag is off.

**Architecture:** Extend the existing `employees` collection, booking picker, auto-assign loop, and slot locks. Add `role: 'employee'` for **new** accounts only; separately **link** existing admins to an employee profile without Auth/role changes. Bookability (`active`) is independent of Auth `disabled` (mirrored as `authDisabled`). Public booking uses a safe projection callable — never public reads of full employee docs. Availability = validated employee hours ∩ salon open/holiday/exception when the flag is on.

**Tech Stack:** React + MUI, TanStack Router/Query, Firebase Auth/Firestore, Cloud Functions (Admin SDK), valibot, Vitest, node:test (functions), Playwright + emulators.

**Spec:** `docs/superpowers/specs/2026-11-24-employee-management-design.md` (including 2026-11-24 amendments)

## Global Constraints

- No automatic migration/demotion of existing admin accounts.
- New employee accounts use `role: 'employee'` only; employees cannot change their own role.
- `employees.active` = bookable only; Auth `disabled` / `authDisabled` = login only — never conflate the two.
- Any admin may change bookability; only primary admin may enable/disable Auth (Auth disable forces `active: false`; bookable-on never re-enables Auth).
- Brand compile-time flag only — no runtime Firestore feature toggle (E2E may force via env overrides without enabling a brand).
- When flag on and no eligible employee → no slots (no salon-only fallback).
- When flag off → salon-only capacity (ignore employees for slot math/assignment).
- No public Firestore read of full employee documents; booking UI uses a callable projection.
- Working hours validated server-side (start < end, no overlaps); missing/invalid hours → no slots.
- Reuse existing employee docs, picker, auto-assign, slot locks, Google Calendar.
- Layers: `routes → pages → components → hooks → data → firebase.ts` (+ brands/features/functions).
- No new dependencies without a stated reason.
- Commits only when the user explicitly asks (skip commit steps otherwise; still run all code/test steps).

## Review Focus

- Flag off while employee docs exist → booking still salon-only. Test in Task 7.
- Existing secondary `admin` still reaches `/admin` after flag on. Test in Task 2.
- Employee cannot PATCH `users/{uid}.role` via client rules. Test in Task 3.
- Unauthenticated client cannot `get` full `employees/{id}` (rules deny); projection callable omits email. Test in Task 3.
- `setEmployeeBookable(true)` after Auth-disable does **not** clear Auth `disabled` / `authDisabled`. Test in Task 3.
- Auth-disabled employee excluded from slots even if someone tampers `active` in a test fixture without going through callables — production path keeps them consistent; availability still requires `authDisabled === false`. Test in Task 7.
- Multi-service booking requires one employee offering **all** selected services. Test in Task 7.
- Overlapping or inverted working-hour intervals rejected by save callable; such data never yields slots. Test in Tasks 3 and 7.

## File map

| Area | Responsibility |
| --- | --- |
| `src/brands/types.ts` + each `module.ts` | `features.employeeManagement?: boolean` |
| `functions/src/config.ts` | `isEmployeeManagementEnabled()` brand map + env override |
| `src/data/schemas.ts` | `employee` role; extended employee schema (`active`, `authDisabled`, …) |
| `functions/src/authz.ts` | `assertEmployee`, self-or-admin helpers |
| `functions/src/admin/users.ts` | `createEmployeeAccount` (new Auth + `employee` role) |
| `functions/src/admin/employees.ts` | link-admin profile, bookability, Auth enable/disable, hours, projection, soft-remove |
| `functions/src/domain/workingHours.ts` (or under openingIntervals) | validate intervals; intersect |
| `firestore.rules` | no public employee reads; admin/self access; no client role writes |
| `functions/src/booking/salonContext.ts`, `reservationWrite.ts` | flag-aware candidates incl. `authDisabled` |
| `src/data/employees.ts`, `employeeAdminApi.ts`, hooks | admin list + public projection client |
| `src/pages/admin/AdminEmployeesPage.tsx` (+ route) | create vs link-admin workflows |
| `src/pages/employee/*` (+ routes) | employee area |
| `src/pages/BookingWizardPage.tsx`, `src/routes/book.tsx` | gated picker from projection |
| `e2e/*` | admin + booking + employee flows |

---

### Task 1: Feature flag + schemas

**Files:**

- Modify: `src/brands/types.ts` (`FeatureFlags`)
- Modify: brand `module.ts` files — default flag off
- Modify: `functions/src/config.ts` — `isEmployeeManagementEnabled()`
- Modify: `src/data/schemas.ts` — role + employee schema
- Test: `src/data/schemas.test.ts`; `functions/config.test.js` (or equivalent)

**Interfaces:**

- Produces:
  - `FeatureFlags.employeeManagement?: boolean`
  - `isEmployeeManagementEnabled(): boolean` — env `EMPLOYEE_MANAGEMENT_ENABLED` overrides; else brand map (all false initially)
  - `employeeSchema`: `firstName`, `lastName`, `displayName`, `email`, `photoUrl?`, `active` (bookable), `authDisabled` (mirrors Auth), `serviceIds`, `createdAt`, `updatedAt`, `removedAt?`
  - `UserRole = 'user' | 'admin' | 'employee'`

- [ ] **Step 1:** Failing tests: role `'employee'`; schema requires `active` + `authDisabled` + `serviceIds`; config env override.
- [ ] **Step 2:** Implement schemas + flag + config helper.
- [ ] **Step 3:** Tests PASS; `pnpm typecheck` for touched types.
- [ ] **Step 4:** Commit only if asked: `feat: employeeManagement flag and employee schemas`

---

### Task 2: Create new employee account (`employee` role) + authz + flag gate

**Files:**

- Modify: `functions/src/authz.ts`
- Modify: `functions/src/admin/users.ts` — `createEmployeeAccount` only (new Auth user path)
- Test: `functions/admin.users.test.js` (match repo functions test style)

**Interfaces:**

- Produces:
  - `assertEmployee`, `assertAdminOrEmployeeSelf`
  - `createEmployeeAccount`: `assertPrimaryAdmin` + flag on; `auth.createUser`; `users.role = 'employee'`; employee doc with `active: true`, `authDisabled: false`; payload `email`, `password`, `firstName`, `lastName`
- Does **not** link admins (that is Task 3).

- [ ] **Step 1:** Failing tests: flag off → `failed-precondition`; success writes `role === 'employee'`; existing admin fixture remains `admin`.
- [ ] **Step 2:** Implement.
- [ ] **Step 3:** Tests PASS.
- [ ] **Step 4:** Commit only if asked: `feat(functions): create employees with employee role`

---

### Task 3: Lifecycle callables, link-admin profile, public projection, rules, hours validation

**Files:**

- Create: `functions/src/admin/employees.ts`
- Create: `functions/src/domain/workingHoursValidation.ts` (+ test) — `assertValidIntervals(intervals)`
- Modify: `functions/src/index.ts` — exports
- Modify: `firestore.rules` — deny public employee reads; admin/self; hours subcollections
- Create: `src/data/employeeAdminApi.ts` + hooks (one mutation hook per file)
- Test: functions tests + rules/e2e rules style as used in repo

**Interfaces:**

- All require flag on unless noted.

| Callable | Authz | Behaviour |
| --- | --- | --- |
| `createEmployeeProfileForAdmin` | `assertAdmin` | Input `{ adminUid, firstName, lastName }` (email from user doc). Target must be `users.role === 'admin'`. Creates `employees/{adminUid}` only — **no** Auth create, **no** role change. Fail if doc exists. `active: true`, `authDisabled: false` (or read current Auth disabled state into mirror). |
| `updateEmployeeProfile` | `assertAdmin` | Names, photo, `serviceIds`; not `active` / Auth / role |
| `setEmployeeBookable` | `assertAdmin` | `{ employeeUid, active }` — Firestore `active` only; never touches Auth. Reject `active: true` when `authDisabled === true` (`failed-precondition`). Setting `active: false` always allowed. |
| `setEmployeeAuthDisabled` | `assertPrimaryAdmin` | `{ employeeUid, disabled: true }` → Auth disabled + `authDisabled: true` + `active: false`. `{ disabled: false }` → Auth enabled + `authDisabled: false`; **do not** set `active: true`. |
| `setEmployeePassword` | `assertPrimaryAdmin` | Auth password only |
| `softRemoveEmployee` | `assertPrimaryAdmin` | Same as Auth-disable + `removedAt` |
| `saveEmployeeWorkingHours` | admin or self | Validate intervals then write weekday doc |
| `saveEmployeeDayException` / delete | admin or self | Validate intervals when not `closed` |
| `listBookableEmployees` | public (or signed-out ok) | Returns `{ id, displayName, serviceIds }[]` where `active && !authDisabled && !removedAt`; flag off → `[]` |

- Domain: `assertValidIntervals(intervals: {start,end}[])` — each `start < end` (HH:mm); sort and ensure no overlap; throw/`HttpsError` invalid-argument.
- Rules: `match /employees/{id} { allow read: if isAdmin() || (isSignedIn() && request.auth.uid == employeeId); allow write: if false }` (writes via callables/Admin SDK). Working hours: employee self or admin. **No `allow read: if true`.**

- [ ] **Step 1:** Failing tests:
  - `assertValidIntervals`: inverted start/end fails; overlap fails; valid multi-gap passes
  - `setEmployeeAuthDisabled(true)` sets `authDisabled` + `active: false` + Auth disabled
  - `setEmployeeBookable(true)` after Auth-disable → rejected (or if temporarily allowed, availability still empty — **implement reject**)
  - `setEmployeeAuthDisabled(false)` clears `authDisabled` but leaves `active: false`
  - `setEmployeeBookable` by non-primary admin succeeds when Auth enabled
  - non-primary cannot call `setEmployeeAuthDisabled`
  - `createEmployeeProfileForAdmin` creates doc, leaves `users.role === 'admin'`, no second Auth user
  - `createEmployeeProfileForAdmin` on existing employee uid → already-exists
  - `listBookableEmployees` omits email; excludes `active: false` and `authDisabled: true`
  - rules: unauthenticated get employee doc denied
- [ ] **Step 2:** Implement callables + validation + rules + client API.
- [ ] **Step 3:** Tests PASS.
- [ ] **Step 4:** Commit only if asked: `feat: employee lifecycle, link-admin, public projection`

---

### Task 4: Admin Employees page + nav (create vs link)

**Files:**

- Create: `src/pages/admin/AdminEmployeesPage.tsx`
- Modify: `src/routes/admin.tsx` — `/admin/employees`
- Modify: settings / shell links when flag on; remove old create-as-admin block
- Modify: `src/i18n/messages.ts`
- Modify: `src/data/employees.ts` — admin fetch (full docs via admin rules)

**Interfaces:**

- Explicit page props/callbacks: `onCreateEmployeeAccount`, `onLinkAdminProfile`, `onSaveProfile`, `onSetBookable`, `onSetAuthDisabled`, `onSetPassword`, `onSoftRemove`, `onSaveHours`, …
- UI must present **two distinct actions**: “Create employee account” vs “Add bookable profile for existing admin” (picker of admins without employee docs).
- Bookability toggle separate from Auth disable/enable controls (Auth controls primary-admin only in UI).

- [ ] **Step 1:** List + create-account form + link-admin flow.
- [ ] **Step 2:** Edit profile/services; separate bookable vs Auth controls.
- [ ] **Step 3:** Flag-off redirect; typecheck.
- [ ] **Step 4:** Commit only if asked: `feat(admin): Employees page with create and link-admin`

---

### Task 5: Service assignment overview

**Files:**

- Extend admin employees UI / small matrix component
- Reuse `updateEmployeeProfile` `serviceIds`

- [ ] **Step 1:** Service-oriented assignment UI + keep per-employee editor.
- [ ] **Step 2:** Unit test toggle helper if extracted.
- [ ] **Step 3:** Commit only if asked: `feat(admin): employee service assignment overview`

---

### Task 6: Working-hours editors (admin + wire for employee area)

**Files:**

- Reuse `AdminOpeningHoursPage` / `openingHoursForm` patterns
- Wire `saveEmployeeWorkingHours` / day-exception callables
- Client-side validation mirroring server (UX); server remains authoritative

- [ ] **Step 1:** Admin employee hours/exceptions UI with validation errors for overlap / start≥end.
- [ ] **Step 2:** Integration: invalid save rejected by callable test already in Task 3; UI shows error.
- [ ] **Step 3:** Commit only if asked: `feat: employee working hours editors`

---

### Task 7: Availability intersection + Auth/bookable eligibility + booking UI

**Files:**

- Modify: `functions/src/domain/openingIntervals.ts` — `intersectLocalIntervals`
- Modify: `functions/src/booking/salonContext.ts` — load schedules; candidate filter
- Modify: `functions/src/booking/reservationWrite.ts` — preview + create
- Modify: booking wizard/routes — use `listBookableEmployees` projection; gate on flag
- Replace direct public `fetchActiveEmployees` Firestore reads for customer UI
- Test: domain + booking concurrency + eligibility

**Interfaces:**

- Flag off: `employeeIdsToCheck = [null]`; projection unused / empty.
- Flag on candidates require **all** of: `active`, `!authDisabled`, `!removedAt`, `serviceIds` ⊇ requested services, **and** validated non-empty open intervals after intersection for the slot day.
- Missing working-hours weekday or empty intervals → employee closed that day (no slots).
- Auth-disabled never candidates even if `active` true in corrupt data (defense in depth: check `authDisabled`).
- Wizard picker from projection filtered by selected services.

- [ ] **Step 1:** Failing tests:
  - intersect math
  - missing hours → no slots
  - invalid intervals on disk treated as closed (or skipped) — never open
  - `authDisabled: true` → excluded
  - `active: false` → excluded
  - flag off → salon-only
  - no eligible service → no slots
  - multi-service requires all services on one employee
- [ ] **Step 2:** Implement wiring.
- [ ] **Step 3:** Concurrency still safe.
- [ ] **Step 4:** Wizard uses projection callable; no public employee collection reads.
- [ ] **Step 5:** Commit only if asked: `feat: employee-aware availability and public projection booking UI`

---

### Task 8: Employee area (restricted)

**Files:**

- `src/pages/employee/*`, `src/routes/employee.tsx` (path prefix `/employee`)
- Login redirect for `role === 'employee'`
- `listMyEmployeeReservations` callable (do not open reservations rules to employees)

- [ ] **Step 1:** Callables + pages + guards.
- [ ] **Step 2:** Tests: forbidden on admin; own bookings only; hours self-edit uses validated save.
- [ ] **Step 3:** Commit only if asked: `feat: employee self-service area`

---

### Task 9: E2E + full verification

**Files:**

- `e2e/employeeManagement.spec.ts`
- Keep default brands flag-off so existing booking E2E stays green
- Enable flag for dedicated e2e brand/env as documented in spec header

- [ ] **Step 1:** Flag off: no employee nav; no stylist step; no public employee doc reads in network assertions if practical.
- [ ] **Step 2:** Flag on:
  - create new employee account → login as employee → `/employee`
  - link existing admin → admin remains admin → appears in bookable projection after hours/services
  - toggle bookable off → excluded from slots; Auth still works
  - Auth-disable → cannot login; unbookable; enabling bookable alone does not restore login
  - Auth-enable leaves unbookable until bookable toggled on
  - customer book specific + any
- [ ] **Step 3:** `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:functions`, e2e smoke + employee spec.
- [ ] **Step 4:** Commit only if asked: `test(e2e): employee management flows`

---

## Self-review (plan vs spec)

| Spec requirement | Task |
| --- | --- |
| Brand flag, no runtime toggle | 1 |
| Backend enforces flag | 2, 3, 7 |
| New `employee` role; no admin migration | 2, 9 |
| Link existing admin profile (no Auth/role change) | 3, 4, 9 |
| Bookability vs Auth separation | 3, 4, 7, 9 |
| Public projection callable; no public full docs | 3, 7, 9 |
| Working-hours validation; missing → no slots | 3, 6, 7 |
| Auth-disabled excluded from booking | 3, 7, 9 |
| Hours ∩ salon envelope; no fallback | 7 |
| Service assignment + overview | 4, 5 |
| Booking picker / any / locks reuse | 7 |
| Employee area restricted | 8 |
| Tests + no regression flag off | 7, 9 |

---

## Execution handoff

Revised plan: `docs/superpowers/plans/2026-11-24-employee-management.md`  
Aligned spec amendments: `docs/superpowers/specs/2026-11-24-employee-management-design.md`

**Do not implement until the user explicitly approves this revised plan.**
