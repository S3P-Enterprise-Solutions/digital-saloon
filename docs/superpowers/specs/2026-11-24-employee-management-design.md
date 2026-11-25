# Employee Management

**Status:** approved  
**Date:** 2026-11-24  
**Approved:** 2026-11-24  
**Amendments:** 2026-11-24 — bookability vs Auth; link-admin profile; public employee projection via callable; working-hours validation; Auth-disabled excluded from booking

## Intent

Salons with more than one bookable stylist need to manage employees (login, hours, services) and let customers book a specific person or any available person. Salons without that need must keep today’s single-capacity booking behaviour unchanged.

Employee Management is an optional product feature, enabled per salon at deploy time via the brand module. It extends the existing employee collection, booking picker, auto-assignment, slot locks, and Google Calendar wiring — it does not replace them.

## Why

- Several deployments already create `employees/{uid}` docs and assign bookings, but every “employee” is a full `admin`, hours are salon-wide only, and there is no service assignment or feature gate.
- Customers and admins need real multi-stylist capacity without breaking salons that stay single-stylist.
- Permissions must be enforceable on the backend: stylists must not administer the salon.

## Goals

- Brand flag `features.employeeManagement` gates all employee management UI and backend behaviour.
- Salon admins create and manage employees (profile, active status, services, hours, passwords) without invitation or verification email.
- Dedicated `employee` role for **newly created** employee accounts, with a restricted employee area (own hours, assigned services, own bookings, own password).
- Existing admin accounts keep their roles and permissions; admins can also be bookable via an employee document without becoming `employee`.
- Availability = employee working hours ∩ salon opening hours / holidays / salon day exceptions, plus busy intervals and existing booking constraints.
- When the feature is enabled, no bookable slot exists unless an active employee offers the service and is free.
- When the feature is disabled, booking behaves as today’s salon-only path (ignore employees for capacity).
- Existing booking APIs, reservation shape (`employeeId` / `employeeName`), slot locks, and Google Calendar stay in place.
- Automated tests cover flag isolation, unchanged existing admin roles, availability, service assignment, booking, and no regression when the flag is off.

## Non-goals

- Runtime Firestore / admin UI feature toggles.
- Email invitations, email verification, or email-based password recovery.
- Multi-tenant single deploy (one Hosting site serving many salons).
- Hard-deleting employees or historical reservations.
- Rebuilding the booking engine, wizard, or Google Calendar integration.
- Employees assigning their own services or managing other employees.
- Automatic migration or demotion of existing admin accounts.
- Complex payroll, tips, or commission features.

## Anti-goals

- Granting salon administration through UI-only hiding while `role` remains `admin`.
- Falling back to salon-only slots when the feature is on but no eligible employee exists.
- Duplicating service documents onto employees.
- Storing passwords in Firestore.
- Coupling feature availability to an employee’s `active` flag.
- Silently changing existing users’ roles when the feature ships or is enabled.

## Constraints

- Stack and layers unchanged: `routes → pages → components → hooks → data → firebase.ts`, plus `brands` / `features` and `functions/`.
- Feature flags remain brand compile-time booleans (`FeatureFlags`); no new flag mechanism.
- One deploy = one salon (`VITE_BRAND` / `VITE_SALON_ID` / functions `BRAND` / `SALON_ID`).
- Valibot at data boundaries; TypeScript strict; no new dependencies without a stated reason.
- Navigation only in `src/routes/**`; pages get typed callbacks/props.
- Cloud Functions re-check authorization (Admin SDK bypasses rules).
- Prefer soft deactivation over physical deletion.
- Reuse: `salons/{id}/employees`, booking employee picker, “any” auto-assign, transactional `slotLocks`, per-employee Google Calendar.

## Approaches considered

### Feature flag

1. **Brand `features.employeeManagement` (chosen)** — matches balayage / brand-modules; per-salon via deploy; backend mirrors via brand key / env.
2. Runtime salon settings toggle — rejected: conflicts with approved brand-modules non-goal.
3. Brand flag + runtime arming switch — rejected: unnecessary for one-salon deploys.

### Identity

1. **Dedicated `employee` role for new accounts (chosen)** — backend-enforced restriction; all existing admins keep `admin` unchanged; no demotion migration.
2. Keep new staff as `admin` with reduced UI — rejected: cannot meet permission goals securely.
3. Auto-demote existing secondary admins to `employee` when the flag turns on — rejected: user requires existing admin accounts left exactly as they are.

### Availability

1. **Employee hours ∩ salon open/holiday/exception envelope (chosen)** — employee further restricts salon capacity.
2. Employee hours replace salon hours when flag on — rejected: salon schedule would stop constraining bookings.

## Design (chosen)

### Feature flag

```ts
// src/brands/types.ts — extend existing FeatureFlags
type FeatureFlags = {
  balayage?: boolean
  employeeManagement?: boolean
}
```

- Frontend: read `activeBrand.features.employeeManagement === true`.
- When false: no Employees admin nav/page, no employee step in booking, no employee-only routes; treat capacity as salon-only (ignore employee docs for slot math and assignment).
- When true: employee UI and booking rules apply; `active` on an employee only controls that person, never the feature itself.
- Backend: `isEmployeeManagementEnabled()` in `functions/src/config.ts`, derived from `getBrandKey()` (explicit map that must match brand modules) with an env override for emulator/tests (`EMPLOYEE_MANAGEMENT_ENABLED=true|false`).
- Callables and slot/reservation paths that depend on employees check this flag. Mutations that manage employees reject with `failed-precondition` when disabled.
- Architecture or unit test: brand module flags and backend brand map stay aligned for known brands.

### Data model

Keep employee document id = Firebase Auth uid.

```ts
// salons/{salonId}/employees/{uid}
{
  firstName: string
  lastName: string
  displayName: string          // derived `${firstName} ${lastName}` for existing consumers
  email: string                // login identifier mirror; Auth remains source of truth for credentials
  photoUrl?: string | null     // optional Storage URL
  active: boolean              // BOOKABLE only — independent of Auth disabled and of the feature flag
  authDisabled: boolean        // mirrors Firebase Auth `disabled`; kept in sync by Auth lifecycle callables
  serviceIds: string[]         // refs to salons/{id}/services/{serviceId}
  createdAt: string
  updatedAt: string
  removedAt?: string | null    // soft-remove marker; doc retained for history
}
```

**Bookability vs login (separate):**

| Control    | Field / system                                       | Who may change     | Effect                                  |
| ---------- | ---------------------------------------------------- | ------------------ | --------------------------------------- |
| Bookable   | `employees.active`                                   | Any admin          | Included/excluded from booking capacity |
| Can log in | Firebase Auth `disabled` (+ mirrored `authDisabled`) | Primary admin only | Sign-in allowed or blocked              |

- Disabling Auth **must** also set `active = false` and `authDisabled = true`.
- Setting `active = true` **must never** clear Auth `disabled` or `authDisabled`. While `authDisabled === true`, `setEmployeeBookable(true)` is **rejected** so the doc stays consistent (Auth-disabled ⇒ not marked bookable).
- Re-enabling login is an explicit primary-admin Auth action; it does not set `active = true`. After Auth is enabled, an admin may set bookable separately.
- Availability also requires `active && !authDisabled` (defense in depth).

Working hours (mirror salon opening-hours shape):

- `salons/{salonId}/employees/{uid}/workingHours/{weekday}` → `{ intervals: { start, end }[] }`
- `salons/{salonId}/employees/{uid}/dayExceptions/{exceptionId}` → `{ date, intervals, closed }`

**Working-hours validation (server-side, required):** for every interval, `start < end`; intervals on the same day must not overlap. Reject invalid payloads. Missing weekday docs, empty intervals, or invalid data must yield **no** open employee intervals for that day (never invent slots).

No separate employee holiday collection in v1: salon holidays already close the salon envelope; employees use day exceptions for vacations/personal days off.

`users/{uid}`:

```ts
{
  email: string
  displayName: string
  role: 'user' | 'admin' | 'employee'  // employee is new
  isPrimaryAdmin?: boolean             // only for admins
  createdAt: string
}
```

Reservations unchanged: keep optional `employeeId` / `employeeName` snapshot. Soft-removed or inactive employees must not break historical reads.

### Authentication & accounts

- Reuse Firebase Auth + Admin SDK callables (extend `functions/src/admin/users.ts` patterns).
- **Create new employee account** (flag on only, distinct flow): primary admin calls callable with email, password, first/last name → `auth.createUser` + `users` doc (`role: 'employee'`) + `employees` doc (`active` default true, `authDisabled: false`). No invite/verify email. Never rewrites existing admin roles.
- **Link existing admin as bookable profile** (flag on only, distinct flow): authorized admin creates `employees/{adminUid}` for an existing `role === 'admin'` user. Reuses that Auth UID. Does **not** create another Auth account and does **not** change `users.role`. Reject if an employee doc already exists for that uid.
- Duplicate email on new-account create: surface Auth `already-exists`.
- Admin reset password (employee-role accounts): callable `setEmployeePassword` (Admin SDK); never elevated from the client SDK.
- Employee self password change: client `updatePassword` after reauth, or narrow self-only callable. No email recovery.
- **Bookability:** any admin may set `employees.active` via callable (does not touch Auth).
- **Auth disable (primary only):** `auth.updateUser({ disabled: true })` + `authDisabled: true` + `active: false`.
- **Auth enable (primary only):** `auth.updateUser({ disabled: false })` + `authDisabled: false`; leaves `active` unchanged (still unbookable until an admin sets `active: true`).
- Soft remove (primary only): Auth-disable path above + `removedAt`; hide from roster/booking; retain doc and booking refs.
- Passwords never stored in Firestore.

### Roles & permissions

| Actor             | Can                                                                                                                                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary admin     | Full salon admin; create new employee accounts; set employee passwords; enable/disable Auth; soft-remove; link admin profiles; profile/hours/services/`active`; all bookings                              |
| Other admin       | Full salon admin except Auth enable/disable, soft-remove, create-account, and set-password; may link admin employee profiles if useful; may edit profile, hours, services, and **bookability** (`active`) |
| Employee          | Own employee area only: view assigned services; edit own working hours / day exceptions; **view** own bookings (read-only in v1 — no confirm/cancel/reschedule); change own password                      |
| Employee must not | Access `/admin/**`; manage other employees; change own `role` / salon association; assign services to self; enable/disable the feature; act on bookings                                                   |
| Operator          | Existing operator powers; primary-admin bootstrap unchanged                                                                                                                                               |

**Call (authz split):** Create account / set password / Auth enable-disable / soft-remove = **primary-admin-only**. Bookability (`active`), profile, hours, services, and link-admin-profile = any `admin`.

**Roles are admin-managed only:** new accounts get `role: 'employee'`. Employees must never change their own `role` or permissions. No automatic migration of existing admins.

Backend:

- Extend `authz.ts`: `assertEmployee`, helpers that allow admin **or** the employee acting on self.
- Firestore rules: **no public read of `employees/{id}`** (full documents include email). Admins read/write; employee may read own doc and write own workingHours/dayExceptions. Clients must not update `users.role`.
- **Public booking projection:** callable (e.g. `listBookableEmployees`) returns only `{ id, displayName, serviceIds }[]` for bookable, Auth-enabled, non-removed employees when the flag is on. Do not rely on field-level Firestore reads (rules cannot redact fields).
- Route guards: `/admin/**` requires `admin` (or operator); `/employee/**` requires `role === 'employee'`; employees hitting admin routes get forbidden.

**Employee session UX (call):**

- After login, employees land on the employee area home (not `/admin`, not customer home-as-default).
- Existing “admins skip customer-only marketing” behaviour should treat employees similarly where it would strand them on the wrong shell; exact `customerOnly` wiring left to the plan.
- Public `/book` remains usable (an employee may still book as a customer); no admin powers there.

### Existing admins and bookable profiles

- **All existing admin accounts keep their current `role` and permissions.** No demotion script or enable-time rewrite.
- Today’s secondary admins remain full admins.
- **New employee accounts** (`createEmployeeAccount`) → `role: 'employee'` only.
- **Link admin profile** (`createEmployeeProfileForAdmin` or equivalent): creates the employee doc for an existing admin UID without Auth/role changes. Distinct UI and callable from “create new employee”.
- Bookable capacity requires: employee doc present, `active === true`, `authDisabled === false`, `!removedAt`, valid hours, and matching `serviceIds`. Role alone does not grant or deny bookability.

### Availability

Extend existing `listAvailableSlots` / `isSlotAvailable` / `previewAvailableSlots` / create transaction — do not fork a second engine.

When **feature disabled**:

- `employeeIdsToCheck = [null]` (salon-only busy + salon weekly/holidays/exceptions), regardless of employee docs.
- No employee picker in the customer UI.

When **feature enabled**:

1. Candidate employees = `active`, `authDisabled === false`, not soft-removed, and `serviceIds` contains every requested service (multi-service: one employee must offer all selected services).
2. If a specific `employeeId` is requested, that candidate must be in the set or the request fails / yields no slots.
3. If the candidate set is empty → **no slots** / create returns unavailable. No salon-only fallback.
4. For each candidate, open intervals for a date = **intersection** of:
   - salon open intervals (existing `resolveOpenIntervalsForDate` with salon weekly + holidays + salon dayExceptions)
   - employee open intervals (validated workingHours + dayExceptions; missing/empty/invalid = closed that day)
5. Busy = that employee’s reservations + blocked slots (existing filter); unassigned legacy busy (no `employeeId`) still blocks every employee when intersecting (keep current conservative filter unless tests show a safer rule — document any change).
6. “Any available”: union of slots across candidates for preview; on create, first successful candidate in stable order (existing loop) under transactional per-employee slot locks.

Salon holidays close everyone. Employee day exceptions further close or reshape that employee only.

### Service assignment

- Stored only as `serviceIds` on the employee doc (references existing salon services).
- Admin can edit assignments on the employee edit UI.
- Admin also gets a service-oriented overview (matrix or per-service employee checklist) where useful — same underlying field, two editors.
- Employees cannot change assignments.
- Removing a service from an employee does not alter existing reservations.
- Cross-salon service ids are impossible in this deploy model; still validate ids exist under the current salon.

### Admin & employee UI

- New admin page **Employees** (nav only when flag on): list; **create new employee account**; **link existing admin profile**; edit profile/services/hours; toggle bookability; primary-only Auth disable/enable, soft-remove, set password.
- Follow existing admin patterns (MUI, i18n, settings/opening-hours form reuse where practical).
- Settings: remove create-employee-as-admin block when flag on (keep `createFirstSalonAdmin`); link to Employees page.
- Employee area (flag on): own hours/exceptions, assigned services (read-only), own bookings, password change.
- Customer booking: picker data from public projection callable; show when flag on and projection non-empty for selected services; empty eligible → no times.

### Google Calendar

- Keep per-employee integration as implemented.
- Only meaningful when the feature is enabled and the employee exists; no redesign.

### Testing focus

- Flag off: no employee UI; salon-only slots; employee callables rejected; existing booking E2E/unit paths still pass.
- Flag on: create new account; link admin profile; bookability vs Auth disable separation; soft-remove; password admin + self; permissions; isolation.
- Roles: new accounts get `employee`; existing admins remain `admin`; employees cannot change own role; employee cannot access admin.
- Availability: intersection; validation rejects bad hours; missing hours → no slots; Auth-disabled excluded; inactive excluded; no eligible → no slots; concurrency.
- Public data: unauthenticated client cannot read full employee docs; projection callable returns safe fields only.
- Services / booking: assign/remove; specific + any; history after soft-remove; linked admin profile bookable.
- Levels: domain unit tests, callable/integration with emulators, Playwright for admin + customer flows.

## Builder calls

- Soft-remove listing UX (recycle bin vs hidden-only) — prefer hidden from default list with no undelete UI in v1 unless cheap.
- Whether employee self password change uses client SDK vs callable — prefer client SDK with reauth if it fits existing auth UX; otherwise callable.
- Interval intersection helper lives next to existing opening-interval domain code.
- Which brands enable the flag initially — all current brands `false` (including kimm); E2E may force via `VITE_EMPLOYEE_MANAGEMENT_ENABLED` / `EMPLOYEE_MANAGEMENT_ENABLED`.
- Exact employee route path prefix (`/employee` vs `/staff`) — pick one and keep it consistent in i18n/nav.
- Public projection: callable preferred over duplicate public docs unless caching forces otherwise.

## Backward compatibility

- Existing admin accounts and permissions are left untouched.
- Existing reservations keep `employeeId` / `employeeName`.
- Flag off restores salon-only capacity even if employee docs exist (behaviour change vs today’s “employees always affect booking if present” — intentional so single-stylist brands are safe).
- Enabling the flag without configured hours/services yields no online slots until admins assign them — acceptable; admin manual booking should surface the same eligibility rules.
- Google Calendar and admin calendar employee filters remain; gate nav/controls with the flag where they would confuse single-stylist salons.

## Rollout sketch

1. Schemas, flag, authz, employee CRUD/password callables + rules (`role: 'employee'` for new accounts only).
2. Admin Employees page + service assignment UI.
3. Employee hours + availability intersection + tests.
4. Gate/fix booking wizard; verify any-assign + locks.
5. Employee area; E2E; full verify.
