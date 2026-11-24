# Employee Admin UI Simplification

**Status:** approved  
**Date:** 2026-11-24  
**Approved by:** verbal ("ja bitte mach das")

## Intent

Salon admins manage employees on one calm screen: list first, access secondary, details per person.

## Goals

- Access (create account / link admin) behind a top button + dialog — not primary content.
- One Accordion per employee with: name, services multi-select, bookable, weekly hours, day exceptions (vacation), auth/password for primary admin.
- Remove redundant service-assignment matrix and bookable-preview blocks.

## Non-goals

- New APIs, data model, or booking behaviour.
- Redesigning employee self-service area.

## Approaches

1. **Restructure page (chosen):** Dialog for access; Accordion list; services as multi-select; drop matrix/preview.
2. Master-detail two-column — rejected (mobile-hostile).
3. Wizard — rejected (too heavy).

## Builder calls

- Services: MUI `Select` multiple with checkboxes (no new Autocomplete pattern).
- Hours/exceptions stay in accordion, loaded only for expanded employee (existing route hooks).
- Drop `bookablePreview*` props from page + route wiring.
- Delete unused `EmployeeServiceAssignmentOverview.tsx`.
