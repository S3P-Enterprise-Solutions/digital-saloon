# SalonFlow

Single-salon online appointment booking (pilot MVP) on the React + Firebase template stack.

Customers book without an account via a single-page, step-based wizard (`/book`; `/` redirects there).
Administrators manage services, hours, and reservations after sign-in.

## Stack

- React 19 + Vite + TypeScript (strict)
- Material UI
- TanStack Router + TanStack Query
- Firebase (Auth, Firestore, Storage, Functions) + Emulator Suite
- Valibot for boundary validation
- `pnpm`, ESLint, Prettier, Vitest, Playwright

## Prerequisites

- Node 22+
- `pnpm`
- Java 21+ (Firestore emulator)

## Setup

```bash
pnpm install
npm --prefix functions ci
cp .env.example .env
```

Optional salon overrides (see `.env.example`): `VITE_SALON_ID`, `SEED_SALON_NAME`, `SEED_SALON_TIMEZONE` (default `Europe/Vienna`), `SEED_ADMIN_EMAIL`.

## Environment files

All real `.env*` files are gitignored; only the `*.example` files are committed. Local dev needs **no** env files — `pnpm dev:local` (or `pnpm dev:salon1500`) runs everything against the emulators (`demo-react-firebase-template`).

Each salon is its own Firebase project, addressed by an alias in `.firebaserc`:

| Brand (`VITE_BRAND` / `BRAND`) | Alias       | Project ID   | Salon ID    | Web config             | Functions config            |
| ------------------------------ | ----------- | ------------ | ----------- | ---------------------- | --------------------------- |
| `kimm`                         | `kimm`      | `kimm-hair`  | `pilot`     | `salons/kimm.env`      | `functions/.env.kimm-hair`  |
| `salon1500`                    | `salon1500` | `salon-1500` | `salon1500` | `salons/salon1500.env` | `functions/.env.salon-1500` |

| File                         | Loaded by                                         | Purpose                                                     |
| ---------------------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| `salons/<brand>.env`         | `pnpm deploy:salon <brand>` (Vite build + deploy) | Brand, salon ID and Firebase Web SDK config of that salon   |
| `functions/.env.<projectId>` | Firebase CLI, deploys to that project only        | Functions config of that salon (`BRAND`, `SALON_ID`, email) |
| `.env`                       | Vite, always (dev + build)                        | Local overrides only (`SEED_*`, …)                          |
| `functions/.env`             | Firebase CLI, every project **incl. emulators**   | Avoid — would leak into every salon and the emulators       |

- Do **not** put `VITE_FIREBASE_*` values in `.env` or `.env.production`: they would be baked into every salon's build (and `.env` also into local dev).
- Functions do not see `salons/<brand>.env` — `BRAND` and `SALON_ID` must also be set in `functions/.env.<projectId>`, otherwise emails use the KIMM design and salon `pilot`.

### `salons/<brand>.env` (web app → that salon's Firebase project)

```bash
cp salons/kimm.env.example salons/kimm.env
firebase apps:sdkconfig WEB --project kimm-hair   # copy values into salons/kimm.env
```

```dotenv
VITE_BRAND=kimm
VITE_SALON_ID=pilot
VITE_SHOW_PRICES=true
BRAND=kimm
SALON_ID=pilot

VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=kimm-hair.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=kimm-hair
VITE_FIREBASE_STORAGE_BUCKET=kimm-hair.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Deploy a salon (build + hosting, rules, indexes, storage and functions): `pnpm deploy:salon kimm`.

### `functions/.env.<projectId>` (salon identity + booking emails)

The file name must match the project ID (e.g. `functions/.env.kimm-hair`), so it is only used when deploying to that project. Copy `functions/.env.example` as a starting point.

Booking emails are sent via the first configured transport: **Mail-Catcher** (local dev) → **SMTP** → **Resend** → none.

```dotenv
BRAND=kimm                                # must match salons/<brand>.env
SALON_ID=pilot
PUBLIC_APP_URL=https://kimm-hair.web.app  # base URL for manage/cancel links in emails

# Option A — Gmail SMTP (no own domain needed)
SMTP_USER=yoursalon@gmail.com
SMTP_PASS=abcdefghijklmnop                # Google App Password (16 chars, spaces are ignored)

# Option B — Resend (needs a domain verified in Resend)
RESEND_API_KEY=re_...                     # Resend → API Keys ("Sending access" is enough)
RESEND_FROM_EMAIL="KIMM Hair <termine@your-domain.it>"
```

**Gmail SMTP setup**

1. Use a dedicated Gmail account for the salon and turn on 2-Step Verification.
2. Create an App Password at <https://myaccount.google.com/apppasswords> and paste it into `SMTP_PASS` — the normal Gmail password does not work.
3. Emails are sent as `"<salon name>" <SMTP_USER>`; override with `SMTP_FROM`. Gmail always rewrites the address to the authenticated account.
4. Optional: `SMTP_HOST` (default `smtp.gmail.com`), `SMTP_PORT` (default `465`; `587` uses STARTTLS). Gmail allows ~500 emails/day.

**Resend notes**

- The sender domain must be verified in Resend (DNS records at your domain registrar). `*.web.app` / `*.firebaseapp.com` cannot be verified.
- Without a verified domain (`onboarding@resend.dev`), Resend only delivers to your own Resend account address.

**General**

- Email failures never block a booking — check `firebase functions:log` (look for `[email]`) if emails don't arrive.
- Locally, `scripts/start-dev.mjs` sets `MAIL_CATCHER_URL`, which overrides SMTP/Resend; open the Mail-Catcher instead of sending real mail.

After changing the file, redeploy: `firebase deploy --only functions -P kimm` (or `pnpm deploy:salon kimm`).

## Daily development

```bash
pnpm start
```

Alias: `pnpm start:local` / `pnpm dev:local`. Frees occupied ports, starts emulators, seeds the pilot salon + admin, then Vite:

| URL         | Port                  |
| ----------- | --------------------- |
| App         | http://127.0.0.1:3100 |
| Emulator UI | http://127.0.0.1:4100 |

Demo admin (after seed): `admin@salonflow.local` / `password123`

Ports are non-default so this stack can run next to other Firebase projects. Free them with:

```bash
pnpm free:ports
```

Vite only (no emulators): `pnpm dev`

## Milestone status

| Slice | Scope                                       | Status |
| ----- | ------------------------------------------- | ------ |
| M1    | Foundation, seed, rules, admin gate         | Done   |
| M2    | Config data access (services, settings)     | Done   |
| M3    | Availability engine + transactional booking | Done   |
| M4    | Customer booking + manage-by-token          | Done   |
| M5    | Admin calendar, confirm/decline, manual     | Done   |
| M6    | Notifications, pending expiry, launch       | Done   |

## Scripts

| Script                               | Purpose                                   |
| ------------------------------------ | ----------------------------------------- |
| `pnpm dev:local`                     | Emulators + seed + Vite                   |
| `pnpm free:ports`                    | Kill listeners on template ports          |
| `pnpm emulators`                     | Emulators only                            |
| `pnpm seed`                          | Seed running emulators                    |
| `pnpm typecheck` / `lint` / `format` | Quality                                   |
| `pnpm test`                          | Vitest (architecture, schemas, port sync) |
| `pnpm test:e2e`                      | Playwright against emulators + Vite       |
| `pnpm test:e2e:install`              | Install Chromium for Playwright           |
| `pnpm verify`                        | Unit/build gate                           |
| `pnpm verify:e2e`                    | `verify` + Playwright                     |
| `pnpm build` / `deploy`              | Hosting build / deploy                    |

### Playwright

```bash
pnpm test:e2e:install   # once
pnpm test:e2e           # starts emulators, seeds, runs smoke journeys
```

Specs live in `e2e/`. The webServer entry is `scripts/start-e2e.mjs` (same ports as `dev:local`, no Emulator UI).

## Architecture

Layers (enforced by `src/architecture.test.ts` + ESLint):

`routes` → `pages` → `components` → `hooks` → `data` → `firebase.ts`

- Public: salon profile + active services via Firestore
- Occupancy changes: Cloud Functions + Firestore transactions
- Availability math: pure domain under `functions/src/domain/`

Routing APIs stay in `src/routes/`. See `AGENTS.md` and `.cursor/rules/`.

## Agent skills

Project skills live under `.agents/skills/`:

- Firebase basics / auth / Firestore / hosting / rules auditor
- Frontend design

## Customer booking links (no email/SMS provider)

- Each booking creates a cryptographically secure management token; Firestore stores only the SHA-256 hash.
- After booking, the personal `/manage/{token}` URL is shown prominently (copy / Web Share / optional `mailto:` to the customer’s own mail app).
- Successful bookings are saved in `localStorage` and listed under **Meine Termine** (`/my-bookings`). Details are always loaded via Cloud Functions — never trusted from local storage alone.
- Pending requests older than `pendingExpirationHours` become `EXPIRED` via `processPendingReservations` (callable + schedule). Admin **Wartung** can trigger this manually.

## Firebase project checklist / deploy

Live: KIMM Hair → https://kimm-hair.web.app (`-P kimm`). Adding a new salon:

1. Create a Firebase project on the Blaze plan; enable Auth (Email/Password), Firestore, Storage, Functions (`europe-west8`).
2. Add a brand module under `src/brands/<brand>/` (homepage, theme/profile, shell, feature flags). Register it in `src/brands/active.ts` and `src/brands/brandKey.ts`. Add an alias in `.firebaserc` and a deploy matrix entry in `.github/workflows/ci.yml`.
3. Create `salons/<brand>.env` and `functions/.env.<projectId>` — see [Environment files](#environment-files). Set `VITE_BRAND=<brand>`.
4. First deploy: `pnpm deploy:salon <brand>`. If functions fail with a cleanup-policy error, run `firebase deploy --only functions -P <brand> --force` once.
5. Seed the salon config and an admin user in the live project (do not reuse emulator-only passwords).

### Brand modules and feature catalog

- **Brand module** (`src/brands/<brand>/`): owns homepage, theme tokens, profile/content, shell (wordmark, document title, favicon), and deploy-time `features` flags. Example: Salon 1500 enables balayage with `features: { balayage: true }` and supplies `featureContent.balayage`.
- **Feature catalog** (`src/features/<name>/`): reusable, brand-agnostic pages. Brands turn them on/off at build time; brand-specific copy/images are passed in via `featureContent`, not `if (brand === …)` inside the feature.
- **Shared core**: booking wizard, admin, Firestore schemas, callables — not copied per brand.
- `VITE_BRAND` is the only brand selector. Runtime/Firestore feature toggles are out of scope.

CI (`push` to `main`) rebuilds and deploys hosting, rules, indexes and storage for every salon whose `FIREBASE_SERVICE_ACCOUNT_<BRAND>` secret is set. **Functions are not deployed by CI** — run `pnpm deploy:salon <brand>` (or `firebase deploy --only functions -P <brand>`) after backend changes.

Security notes:

- Reservations / slotLocks are function-mediated; no public reservation PII reads.
- Management tokens are bearer secrets (hash-only at rest); validate every access server-side.
