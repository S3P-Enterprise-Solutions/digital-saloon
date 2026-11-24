# Employee Admin UI Simplification Implementation Plan

> **For agentic workers:** Native inline execution (partner asked to implement).

**Goal:** Simplify admin employees page: access dialog + per-employee accordion with services, hours, exceptions.

**Architecture:** Restructure `AdminEmployeesPage` only; keep existing hooks/callables. Drop preview + service matrix UI. Expand still drives hours/exceptions loading via `selectedEmployeeId`.

**Tech Stack:** React, MUI Accordion/Dialog/Select, existing i18n.

**Spec:** `docs/superpowers/specs/2026-11-24-employee-admin-ui-design.md`

## Global Constraints

- No new dependencies; layers unchanged; pages receive callbacks/props.
- Do not commit unless partner asks.

## Review Focus

- Accordion expand still sets `selectedEmployeeId` so hours/exceptions load.
- Access dialog remounts on open (`key` / conditional render) to reset forms.
- Removed overview file must not leave unused imports / architecture failures.

---

### Task 1: Restructure AdminEmployeesPage

**Files:**

- Modify: `src/pages/admin/AdminEmployeesPage.tsx`
- Modify: `src/routes/admin.tsx` (drop bookablePreview wiring)
- Modify: `src/i18n/messages.ts` (access button/dialog keys)
- Delete: `src/pages/admin/EmployeeServiceAssignmentOverview.tsx`

- [ ] Access: outlined button opens Dialog with create + link sections
- [ ] List: MUI Accordion; summary = name + email + status chips
- [ ] Details: name, services multi-Select, bookable, hours, exceptions, auth
- [ ] Remove matrix + preview; drop unused props
- [ ] Verify: `pnpm typecheck`, `pnpm lint`, relevant tests
