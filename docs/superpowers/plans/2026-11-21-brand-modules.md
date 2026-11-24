# Brand Modules + Feature Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace scattered `VITE_BRAND` conditionals with per-salon `BrandModule`s and a boolean feature catalog so customer skins stay isolated while booking/admin stay shared.

**Architecture:** `src/brands/<key>/` owns homepage, theme, profile, shell slots, feature flags, and feature content. `src/features/<name>/` owns brand-agnostic extras (start: balayage). One `getActiveBrandModule()` loader keyed by `VITE_BRAND` wires theme, home, shell, and which feature routes mount. Public brand contract uses `RouteDefinition`, not TanStack `AnyRoute`.

**Tech Stack:** React 19, MUI, TanStack Router, Vite (`VITE_BRAND`), Vitest architecture tests, existing Firebase deploy scripts.

**Spec:** `docs/superpowers/specs/2026-11-21-brand-modules-design.md`

## Global Constraints

- No new dependencies.
- Layers: routes → pages → components → hooks → data → firebase; extend with `brands` / `features` as in tasks.
- Shared core must never import `brands/kimm` or `brands/salon1500` by path.
- Features must never import `brands/**` or branch on brand key.
- Brand modules must not import other brand modules.
- Feature flags are booleans only (`FeatureFlags`); types must allow a later config union without a rewrite.
- Navigation only in `src/routes/**` (existing ESLint rule).
- Do not duplicate booking/admin into brands.
- Do not build a page builder or generic plugin host.
- Keep existing booking/admin tests green; commits only if the user asks.

## Review Focus

- Kimm build: `/balayage` absent from route tree; AppShell shows no Balayage nav.
- Salon1500 build: `/balayage` present; nav link works; page receives salon1500 content via props (no `brand.key` inside the feature).
- Unknown / empty `VITE_BRAND` resolves to kimm.
- Editing `src/brands/salon1500/**` does not require edits under `src/brands/kimm/**`.
- `pnpm test` architecture suite fails if a core file imports a concrete brand path or if a feature imports brands.

## File map

| Path                                                                            | Responsibility                                                                                                                                    |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/brands/types.ts`                                                           | `BrandModule`, `BrandProfile`, `FeatureFlags`, `RouteDefinition`, shell/content types                                                             |
| `src/brands/createSalonTheme.ts`                                                | Shared MUI theme factory from tokens → `{ theme, brandColors }`                                                                                   |
| `src/brands/active.ts`                                                          | Sole runtime brand switch on `VITE_BRAND`; exports `getActiveBrandModule`, `getActiveBrandKey`                                                    |
| `src/brands/kimm/module.ts` (+ `HomePage`, `profile`, shell)                    | Kimm brand module                                                                                                                                 |
| `src/brands/salon1500/module.ts` (+ homepage, profile, shell, balayage content) | Salon1500 brand module                                                                                                                            |
| `src/features/types.ts`                                                         | Feature id union; optional future config types                                                                                                    |
| `src/features/registry.ts`                                                      | Map feature id → route contributor; used only when flag true                                                                                      |
| `src/features/balayage/*`                                                       | Brand-agnostic Balayage page + route contributor + content type                                                                                   |
| `src/theme.ts`                                                                  | Re-export `theme` + `brand` colors from active module (keep call sites stable)                                                                    |
| `src/architecture.test.ts`                                                      | Boundary + contract + no-conditional + route-registration rules                                                                                   |
| Delete / shrink                                                                 | `src/data/brands.ts` values (types move); `src/pages/HomePage.tsx` switch; `src/pages/Salon1500HomePage.tsx`; brand ifs in AppShell/Wordmark/main |

---

### Task 1: Types, theme factory, active loader stub + contract tests

**Files:**

- Create: `src/brands/types.ts`, `src/brands/createSalonTheme.ts`, `src/brands/active.ts`
- Create: `src/brands/kimm/module.ts`, `src/brands/salon1500/module.ts` (minimal modules: profile + theme + placeholder HomePage + flags)
- Create: `src/brands/active.test.ts` (replace/migrate `src/data/brands.test.ts`)
- Modify: `src/architecture.test.ts` — allow `brands` layer
- Modify: `src/data/salonConfig.ts`, `src/data/homepageConfig.ts` — import profile helpers/types from brands without importing a concrete brand folder
- Delete or thin: `src/data/brands.ts` (re-export shims only if needed for one PR; prefer delete after call sites move)

**Interfaces:**

- Produces:
  - `export type FeatureFlags = { balayage?: boolean }`
  - `export type RouteDefinition = { id: string; path: `/${string}` }` (pages wired later via registry/private route helper — no `AnyRoute` on `BrandModule`)
  - `export type BrandModule = { key: string; HomePage: …; theme: Theme; brandColors: …; profile: BrandProfile; features: FeatureFlags; featureContent?: { balayage?: BalayageContent }; shell?: BrandShellSlots; privateRoutes?: readonly RouteDefinition[] }`
  - `createSalonTheme(tokens: BrandThemeTokens): { theme: Theme; brandColors: BrandColorTokens }`
  - `getActiveBrandKey(): string` / `getActiveBrandModule(): BrandModule`
  - Temporary: both modules export a tiny stub `HomePage` that renders `profile.name` so the graph typechecks before Task 2 moves real pages

- [ ] **Step 1:** Write failing tests in `src/brands/active.test.ts`: empty `VITE_BRAND` → `kimm`; `salon1500` → that module’s `key`/`profile.name`; both modules satisfy required `BrandModule` fields (`features` object present).
- [ ] **Step 2:** Run `pnpm exec vitest run src/brands/active.test.ts` — expect FAIL (modules missing).
- [ ] **Step 3:** Implement types, `createSalonTheme` (move logic from current `theme.ts`), minimal kimm/salon1500 modules with current profile/color data from `src/data/brands.ts`, and `active.ts` registry map keyed by brand key (default kimm).
- [ ] **Step 4:** Point `theme.ts` at active module re-exports (`theme`, `brand` = `brandColors`). Update `salonConfig.getSalonId` to use `getActiveBrandModule().profile.defaultSalonId`. Update architecture `allowedLayerImports` for `brands` and `theme.ts` → `brands`.
- [ ] **Step 5:** Tests PASS; `pnpm typecheck` PASS for this slice.

### Task 2: Move homepages + shell slots into brand folders

**Files:**

- Create: `src/brands/kimm/HomePage.tsx` (from current default branch of `src/pages/HomePage.tsx` + styles as needed)
- Create: `src/brands/salon1500/HomePage.tsx` (from `Salon1500HomePage.tsx`)
- Create: shell wordmark components under each brand (extract from `Wordmark.tsx` branches)
- Modify: `src/brands/*/module.ts` — real `HomePage` + `shell`
- Modify: `src/routes/home.tsx` — render `getActiveBrandModule().HomePage`
- Modify: `src/components/AppShell.tsx`, `src/components/Wordmark.tsx` — use `shell` slots / remove `brand.key ===` branches
- Modify: `src/main.tsx` — title, favicon, theme-color from active module/shell
- Modify: `src/pages/admin/AdminHomepagePage.tsx` — `getActiveBrandModule().profile` for gallery defaults
- Delete: `src/pages/HomePage.tsx` switch wrapper, `src/pages/Salon1500HomePage.tsx` (after move); keep shared `HomePageProps` type in `src/brands/types.ts` or `src/pages/homePageProps.ts` if styles still shared

**Interfaces:**

- Consumes: `BrandModule` from Task 1
- Produces: `BrandShellSlots = { HeaderWordmark; HeroWordmark?; documentTitle; faviconHref?; themeColor }`
- `HomePageProps` remains the shared explicit props contract used by `home.tsx`

- [ ] **Step 1:** Move pages into brand folders; wire modules; home route uses active `HomePage`.
- [ ] **Step 2:** Replace Wordmark/AppShell brand key checks with shell slots; Balayage nav still gated temporarily by `features.balayage` (even before Task 3 registry — set `features: { balayage: true }` only on salon1500).
- [ ] **Step 3:** `main.tsx` uses shell documentTitle/favicon/themeColor; remove local `isSalon1500`.
- [ ] **Step 4:** Run `pnpm typecheck` and `pnpm exec vitest run src/brands` — PASS. Manually confirm no `salon1500`/`kimm` string compares outside `src/brands/active.ts` and tests (grep).

### Task 3: Feature catalog — balayage behind boolean flag

**Files:**

- Create: `src/features/types.ts`, `src/features/registry.ts`
- Create: `src/features/balayage/content.ts` (type `BalayageContent`), `src/features/balayage/BalayagePage.tsx` (move from `src/pages/BalayagePage.tsx`, accept content via props), `src/features/balayage/contributeRoute.ts` (creates TanStack route; not exported on `BrandModule`)
- Modify: `src/brands/salon1500/module.ts` — `features.balayage: true` + `featureContent.balayage` with current packages/images
- Modify: `src/brands/kimm/module.ts` — omit or `balayage: false`
- Modify: `src/router.ts` — mount feature routes via registry + active flags only; mount `privateRoutes` via a small routes helper that maps `RouteDefinition` + brand page map if any (none required in v1)
- Modify: `src/routes/root.tsx` / AppShell — show Balayage affordances only when `features.balayage`
- Delete: unconditional `balayageRoute` import behavior; remove `src/pages/BalayagePage.tsx` after move
- Keep thin `src/routes/balayage.tsx` only if the contributor lives there — prefer feature-owned contributor called from `router.ts` to avoid brand imports in features

**Interfaces:**

- Consumes: `FeatureFlags`, `featureContent` from active module
- Produces:
  - `contributeBalayageRoute(parent, content: BalayageContent): AnyRoute` (TanStack type stays inside features/routes, not on `BrandModule`)
  - `buildFeatureRoutes(parent, module: BrandModule): AnyRoute[]` — includes balayage iff `module.features.balayage === true` and content is defined (fail loud in dev if flag true and content missing)
- `BalayagePageProps` includes `content: BalayageContent` plus existing callbacks

- [ ] **Step 1:** Failing test `src/features/registry.test.ts`: given module with `balayage: false`, `buildFeatureRoutes` returns no `/balayage`; with `true` + content, returns a route whose path is `/balayage`.
- [ ] **Step 2:** Implement move + registry; wire `router.ts`.
- [ ] **Step 3:** Ensure `BalayagePage` / feature files contain no `getActiveBrand` / brand key checks; salon1500-specific URLs live only in `brands/salon1500` content.
- [ ] **Step 4:** Tests PASS; `pnpm typecheck` PASS.

### Task 4: Architecture boundaries + docs + verification

**Files:**

- Modify: `src/architecture.test.ts` — full boundary suite from the spec
- Modify: `README.md` (brand / `VITE_BRAND` section) — describe brand modules + feature flags
- Modify: `AGENTS.md` only if layer list needs a one-line update
- Optional: `src/brands/noBrandConditionals.test.ts` or fold into architecture test via source scan

**Interfaces:**

- Architecture assertions (production files):
  1. No imports of `brands/kimm` or `brands/salon1500` except from `brands/active.ts` and files under that same brand folder
  2. No file under `features/` imports `brands/`
  3. No file under `brands/<a>/` imports `brands/<b>/`
  4. Helper unit test already covers disabled feature routes (Task 3); architecture may re-assert router assembly uses `buildFeatureRoutes`
  5. Import every brand module in a test and `expect(module).toMatchObject({ key, features, profile, theme: expect.anything(), HomePage: expect.any(Function) })`
  6. Scan production `.ts/.tsx` for brand-key comparisons (`==='salon1500'`, `==='kimm'`, `isSalon1500`) — allowlist only `brands/active.ts`

- [ ] **Step 1:** Add failing architecture tests for a deliberate violation pattern (or write assertions first and fix code until green).
- [ ] **Step 2:** Implement allowlist/scan; fix any remaining stragglers (`Wordmark`, `main`, emails out of scope unless they import web brands).
- [ ] **Step 3:** Update README brand docs (module folder + `features.balayage` example).
- [ ] **Step 4:** Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
- [ ] **Step 5:** Build both brands: `VITE_BRAND=kimm pnpm build` and `VITE_BRAND=salon1500 pnpm build` (or existing `pnpm deploy:salon` dry build path without deploy). Run `pnpm test:e2e:smoke` if emulators available; if skipped, note it.

---

## Self-review notes

- Spec coverage: types, both brands, theme/profile/home moves, active loader, shell/favicon, balayage catalog + flags, architecture tests, docs, dual build — each has a task.
- `RouteDefinition` stays on the brand contract; TanStack route objects stay in features/routes helpers.
- Boolean flags with `featureContent` injection satisfies “config later” without a config union in v1.
- Reachability: `active.ts` statically maps both brand modules so architecture “reachable from entry” stays honest; inactive brand UI is not registered. Feature modules are imported by the registry factory map but routes mount only when enabled.
