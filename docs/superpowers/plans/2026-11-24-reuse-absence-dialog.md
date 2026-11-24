# Reuse AbsenceDialog for employees

**Goal:** Share salon absence dialog with employee exceptions; map AbsenceSave → day exception callables.

**Architecture:** Extract AbsenceDialog; add `employeeDayExceptionsOf`; EmployeeDayExceptionForm uses dialog + list/delete.

**Spec:** `docs/superpowers/specs/2026-11-24-reuse-absence-dialog-design.md`

### Task 1: Mapper + tests
- Create `src/data/employeeAbsenceSave.ts` + test: holiday range → N closed; dayException → one; exceptionId = date

### Task 2: Extract AbsenceDialog
- Create `src/components/AbsenceDialog.tsx`; AdminOpeningHoursPage imports it; conflict props optional

### Task 3: Wire employee form
- Rewrite EmployeeDayExceptionForm to use AbsenceDialog; pass todayYmd + weekly; drop edit
- AdminEmployeesPage + EmployeeHoursPage (+ routes) supply todayYmd/weekly/timeZone as needed

### Task 4: Verify typecheck/lint/tests
