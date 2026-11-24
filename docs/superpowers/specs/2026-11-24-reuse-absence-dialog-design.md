# Reuse salon AbsenceDialog for employees

**Status:** approved  
**Date:** 2026-11-24  
**Approved:** verbal — approach 1; salon vacation applies to employees automatically, not reverse

## Intent

Employee absences use the same add-absence dialog UX/code as salon opening hours. Weekly hours stay on shared `WeeklyHoursForm`.

## Domain

- Salon closures (holidays / day exceptions) already ∩ with employee hours in booking availability — no need to copy salon holidays onto employees.
- Employee exceptions are personal only (vacation, shorter day).

## Approach

1. Extract `AbsenceDialog` to `src/components/AbsenceDialog.tsx`.
2. Map `AbsenceSave` → employee day-exception writes via `employeeDayExceptionsOf` (holiday range → N closed docs; single-day → one DayException). Use `date` as `exceptionId` for upserts.
3. Replace employee exception dialog with shared `AbsenceDialog`; list stays add+delete (salon-like; drop inline edit).
4. Conflict booking query stays salon-only (optional props).

## Non-goals

- Employee holiday collection / new callables.
- Changing availability intersection logic.
