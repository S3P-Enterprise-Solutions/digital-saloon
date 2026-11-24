# Project rules

## Stack

- TypeScript with strict checking.
- Client-rendered React SPA: Vite, Material UI, TanStack Router, TanStack Query, Firebase Hosting. No SSR.
- Server code lives only in `functions/` (callable Cloud Functions, Node 22, Admin SDK). Every function re-checks authorization itself because the Admin SDK bypasses security rules.
- Package manager: `pnpm`. Node `>=22`. Java 21+ is required for the Firestore emulator.

## Explicitness

- Prefer explicit code over implicit behavior: descriptive names, clear control flow, visible defaults.
- Declare types for component props, hook inputs, API responses, and exported function return values. Infer only when an annotation would merely repeat the value.
- Declare React components as `React.FunctionComponent<Props>` with `import type * as React from 'react'`.
- Pass dependencies and actions through named props and callbacks. Avoid hidden coupling via globals or effects that coordinate unrelated components.
- Make loading, error, empty, and success behavior explicit. Validate external data at the boundary with valibot (`src/data/schemas.ts`).
- Use effects only to sync with systems outside React (Auth, Firestore listeners, DOM APIs). Derive during render; handle user actions in event handlers.
- Keep `sx` for small one-offs. Put larger styles in `styled()` components in a neighboring `*.styles.ts` file. Do not add a second CSS-in-JS library.
- Format with Prettier (`pnpm format`).

## Layers

- Dependencies point one way: `routes` → `pages` → `components` → `hooks` → `data` → `firebase.ts`, plus `brands` (per-salon modules) and `features` (catalog extras).
- `data` and `hooks` never import UI; `components` and `pages` never import routes; only `pages` and `routes` read the session (`auth`).
- Shared core must not import a concrete brand folder; features must not import brands; brand modules must not import each other.
- `src/architecture.test.ts` enforces layer imports, brand/feature boundaries, no runtime cycles, and no unused source files.
- A new top-level folder under `src/` must be added to `allowedLayerImports` in that test.

## Routing

- Keep route definitions and navigation in `src/routes/`. Keep `src/router.ts` limited to assembling the route tree and registering types.
- Read params/search and call navigation APIs only in route files.
- Pages, components, and hooks must not import `@tanstack/react-router`, `Link`, `Outlet`, or hard-coded internal destinations.
- Pass navigation as typed callbacks (`onHomeClick`, `onLoginClick`, …). Pass route-derived data as typed props.
- Render `Outlet` in the route component and pass it to layouts as `children`.
- ESLint enforces this (`eslint.config.js`). Do not disable the rule; add a callback prop instead.

## URL state

- Prefer path/search params over `useState` for shareable page state.
- Validate and update URL params in route files. Treat the URL as the source of truth; do not mirror it in React state with effects.

## TanStack Query

- Put each query/mutation in a `useXXX` hook under `src/hooks/`, one hook per file.
- Build every query key with `queryKeyOf` from `src/hooks/queryKeys.ts`. Mark roots `'public'` or `'private'`.
- Do not call `useQuery` / `useMutation` directly in UI or route files.

## Local Firebase

| Service     | Port |
| ----------- | ---- |
| Vite app    | 3100 |
| Emulator UI | 4100 |
| Auth        | 9190 |
| Firestore   | 8180 |
| Storage     | 9290 |
| Functions   | 5101 |

- Daily path: `pnpm dev:local` (frees ports → emulators → seed → Vite).
- Force-free ports: `pnpm free:ports` or `DEV_FORCE_FREE_PORTS=true`.
- Keep ports: `DEV_KEEP_PORTS=true`.

## Verification

After changes, run the relevant of: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build`. Use `pnpm verify` for the unit/build gate.

Playwright E2E (starts emulators + Vite via `scripts/start-e2e.mjs`):

- First time: `pnpm test:e2e:install`
- Smoke: `pnpm test:e2e:smoke` or full `pnpm test:e2e`
- Full gate including E2E: `pnpm verify:e2e`

Do not reuse a plain `pnpm dev` server for E2E — it may not be seeded or emulator-backed.

## Quality gates

- No `any`, no unused variables renamed to `_unused` to silence the compiler.
- Do not delete or weaken tests to get green.
- Every `eslint-disable` needs a one-line reason.
- No new dependency without a stated reason.

### Pull request checklist

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm format:check` pass
- [ ] Relevant tests and `pnpm build` pass
- [ ] New behavior has a test
- [ ] README updated if structure or commands changed
