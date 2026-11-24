# Brand modules: per-customer website personalization

**Status:** approved  
**Date:** 2026-11-21

## Intent

SalonFlow is one booking product deployed once per salon. Today, customer look-and-feel and extra marketing pages are selected with scattered `if (brand === 'salon1500')` branches (`theme.ts`, `brands.ts`, `HomePage.tsx`, `AppShell.tsx`, always-on `/balayage`). That does not scale: changing one customer risks another.

We want each customer to live in an explicit **brand module**. Shared product features stay in a catalog and are turned on/off **at deploy time** by that module. A customer can also keep private routes that later graduate into the catalog when a second salon needs them.

## Why

- Isolation: edits to Kimm’s homepage/styles must not touch Salon1500’s build surface.
- Reuse: when a feature is valuable for more than one salon, it becomes a catalog feature and other modules enable it with a flag.
- Deploy already decides the salon (`VITE_BRAND` / `pnpm deploy:salon <brand>`); feature selection should follow the same rule — no runtime admin toggles for product features.

## Goals

- One folder per brand (e.g. `src/brands/kimm`, `src/brands/salon1500`) that owns homepage, theme/tokens, brand content, feature flags, and optional private routes.
- Shared **feature catalog** under `src/features/…`; modules enable features via typed boolean flags (config shape reserved for later).
- Core booking/admin product remains shared (wizard, admin, Firestore schemas, callables).
- Build for brand A does not register brand B’s private UI or disabled catalog features.
- Adding a third brand means adding a module + `salons/<brand>.env`, not new conditionals in core files.
- Architecture tests enforce brand/feature/core boundaries.

## Non-goals

- Runtime feature flags in Firestore or admin UI.
- Monorepo / separate npm packages per brand.
- Vite path-alias “file overwrite” of shared sources.
- Multi-tenant single deploy (one Hosting site serving many brands).
- Redesigning booking UX or admin as part of this change.
- Generic page builder / plugin framework.
- Complex feature configuration objects in v1 (booleans only; interface must allow config later).
- Perfect physical isolation of shared-core bugfixes (a core fix still ships to every salon on next deploy) — only customer-specific surfaces are isolated.

## Anti-goals

- Reintroducing brand switches in `theme.ts`, `AppShell`, `HomePage`, or `router.ts` beyond a single active-brand loader.
- Copy-pasting entire booking/admin trees into each brand folder.
- Features containing `brand.key === '…'` (or equivalent) conditionals.
- Shipping disabled catalog features’ routes into the active salon’s route tree.
- Over-engineering for two salons.

## Constraints

- Keep existing stack and layers: routes → pages → components → hooks → data → `firebase.ts` (extended with `brands` / `features`).
- Keep per-salon Firebase projects and `salons/<brand>.env` deploy flow.
- Navigation stays in `src/routes/**` (pages get callbacks).
- TypeScript strict; no `any`; valibot at data boundaries unchanged.
- Shared core must never import a specific brand module.
- Features must be brand-agnostic; brand-specific content is passed in via explicit props/config from the brand module at wiring time.
- Public `BrandModule` contract must not expose TanStack `AnyRoute`; use a controlled `RouteDefinition` (or equivalent) that routes/features integrate internally.
- `VITE_BRAND` is the single build-time brand selector.
- No new dependencies without an explicit reason.
- Don’t over-engineer: smallest implementation that establishes correct boundaries.

## Approaches considered

1. **Brand module + typed manifest + feature catalog** (chosen) — explicit composition, deploy-time flags, private→catalog graduation.
2. **Vite alias file overrides** — rejected: implicit, weak for optional routes/flags, fights architecture tests.
3. **Monorepo packages** — rejected: tooling cost too high for current scale.

## Design (chosen)

### Mental model

```
salons/<brand>.env          → Firebase project + VITE_BRAND (unchanged)
src/brands/<brand>/         → website skin + flags + private extras + feature content wiring
src/features/<feature>/     → reusable, brand-agnostic marketing/product extras
src/pages|hooks|data|…      → shared core (booking, admin, salon settings)
```

### Responsibilities

| Area            | Owns                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Brand           | Homepage, theme, logo/wordmarks, customer content, feature flags, optional private routes, content passed into enabled features |
| Feature catalog | Reusable marketing pages / optional product UI (no brand conditionals)                                                          |
| Private routes  | Customer-only functionality not yet reusable                                                                                    |
| Shared core     | Booking wizard, admin, Firebase schemas, callables, shared business logic                                                       |

Homepage stays brand-owned. Reusable marketing pages live in the feature catalog (not duplicated per brand). No page builder.

### Brand manifest

```ts
type FeatureFlags = {
  balayage?: boolean
  // later: balayage?: boolean | BalayageFeatureConfig
}

type BrandModule = {
  key: string
  HomePage: React.FunctionComponent<HomePageProps>
  theme: Theme
  /** Palette helpers used by sx (espresso/orange/…) derived from profile tokens. */
  brandColors: BrandColorTokens
  profile: BrandProfile
  features: FeatureFlags
  /** Optional content/props for enabled features (brand → feature injection). */
  featureContent?: {
    balayage?: BalayageContent
  }
  shell?: BrandShellSlots // HeaderWordmark, HeroWordmark, document title, favicon href, …
  /** Controlled definitions — not TanStack AnyRoute on the public contract. */
  privateRoutes?: readonly RouteDefinition[]
}
```

### Feature catalog

- Location: `src/features/<name>/`.
- Boolean flags only in v1; types structured so a flag value can later become a config object.
- Features never import `src/brands/**` and never branch on brand key.
- Brand-specific packages/images/copy are passed from the brand module when routes are assembled.
- Initial feature: **balayage** (graduate from always-on router entry).

### Active brand resolution

- `VITE_BRAND` → one loader (`src/brands/active.ts` or equivalent).
- Only the active brand’s module is used at runtime for shell/home/theme/flags.
- Prefer build-time separation / tree-shaking where reasonably achievable without a plugin framework.
- No runtime/Firestore feature toggles.

### Route assembly

- Shared routes stay in `src/routes/` + `router.ts`.
- Home route renders `activeBrand.HomePage`.
- Catalog feature routes mount only when the active brand’s flag is true.
- Private routes mount only for the active brand via `RouteDefinition` → internal TanStack integration in the routes layer.

### Architecture tests (required)

1. Shared core must not import specific brand modules.
2. Features must not import brand modules.
3. Brand modules must not depend on other brand modules.
4. Disabled features must not register their routes.
5. Each brand must satisfy the `BrandModule` contract.
6. No brand-specific conditionals outside the active brand loader (except intentional tests).

Keep all existing booking and admin tests intact.

### Deploy / env

Unchanged: `salons/<brand>.env`, `pnpm deploy:salon <brand>`, `pnpm dev:salon1500`.

### Migration order (implementation)

1. Shared `BrandModule` types.
2. Brand modules for `kimm` and `salon1500`.
3. Move themes and profiles into modules.
4. Move homepage implementations into brand folders.
5. Active loader + router + AppShell + Wordmark + favicon.
6. Feature registry; `/balayage` conditional on flags + injected content.
7. Architecture tests + README/docs.
8. Verify both salon builds and existing E2E.

## Builder calls

- Exact filenames (`module.ts` vs `index.ts`), `RouteDefinition` shape, and whether unused brand/feature files stay in the Vite graph for architecture reachability — pick the smallest pattern that satisfies ESLint routing rules and the architecture tests above.
- Shared `createSalonTheme(tokens)` helper vs fully duplicated MUI overrides — prefer a shared helper brands compose.
- Bundle exclusion of inactive brands is best-effort; behavior isolation and route registration rules are required.
- i18n may stay in shared `messages.ts` for MVP.
