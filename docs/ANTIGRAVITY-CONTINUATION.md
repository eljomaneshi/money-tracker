# Current Continuation State — 2026-10-09

## 1. Repository & Git State
- **Repository:** `eljomaneshi/money-tracker`
- **Branch:** `main`
- **Latest pushed commit:** `7a544a4 feat(ui): v2 Phase 6 — public trust pages and final polish`
- **Local branch state:** Synchronized with `origin/main`.
- **Working tree:** Clean (except unstaged `docs/ANTIGRAVITY-CONTINUATION.md`).
- **Rule:** Do not deploy without explicit later approval.

---

## 2. Completed Work

### Commit 7a544a4 — Task v2 Phase 6: Public Trust Pages & Final Polish
Phase 6 was verified with a clean build, reviewed locally, committed, and pushed to `main`.
- **Files changed in commit `7a544a4`:**
  - `frontend/src/components/TrustPageShell.tsx` (modified)
  - `frontend/src/pages/Landing.tsx` (modified)
  - `frontend/src/pages/Privacy.tsx` (modified)
  - `frontend/src/pages/Terms.tsx` (modified)
  - `frontend/src/pages/Security.tsx` (modified)
- **Delivered behavior:**
  - **Shared Trust Layout Shell (`TrustPageShell.tsx`):**
    - Updated to v2 Obsidian styling (`bg-[#f8fafc] dark:bg-[#070b14]`).
    - Sticky backdrop blur header (`bg-white/80 dark:bg-[#070b14]/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10`).
    - Brand logo updated with emerald live indicator pulse matching `AuthShell.tsx`.
    - Header navigation actions upgraded to v2 `Button` primitives (`primary`, `outline`, `ghost`).
    - Content wrapped in v2 `Card` container (`padding="lg"`) with `"Trust & Transparency"` status pill.
    - Footer refreshed with Obsidian typography and emerald hover accents.
  - **Public Landing Page (`Landing.tsx`):**
    - Modern ambient emerald radial mesh and subtle grid background matching `AuthShell.tsx`.
    - Hero section updated with `Personal Finance Workspace` eyebrow badge, bold high-contrast typography, and v2 `Button` CTAs with `ArrowRight` icon.
    - Three privacy trust telemetry badges: *"Privacy-First Architecture"*, *"No Bank Credentials Needed"*, *"Zero Tracker Cookies"*.
    - 6-item feature grid rendered using v2 `Card` (`hover={true}`) with custom emerald icon badges (`bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20`).
    - Redesigned Obsidian FinTech CTA banner with ambient radial glow and dual action buttons.
    - Footer aligned with `TrustPageShell`.
  - **Policy & Trust Pages (`Privacy.tsx`, `Terms.tsx`, `Security.tsx`):**
    - Refreshed section titles and line measure with v2 typography and subtle section dividers (`divide-y divide-slate-200/80 dark:divide-white/10`).
    - Styled mailto contact links with v2 emerald tokens (`text-emerald-600 dark:text-emerald-400 underline`).
    - 100% verbatim copy preservation across all 7 privacy sections, 7 terms sections, and 7 security sections.
  - **Architectural milestone:**
    - Full v2 Privacy-First FinTech UI Redesign (Phases 1–6) is now complete across all views.
    - Zero backend, database schema, migration, or dependency changes.
    - Build verified clean: `tsc -b && vite build` exited with code 0.

### Commit 3bad3ce — Public Landing & Trust Pages
The following public frontend improvements were implemented, reviewed locally, verified with clean builds, and committed:
- New public Landing page at `/` for unauthenticated visitors.
- New public Privacy & Data Handling page at `/privacy`.
- New public Terms of Use page at `/terms`.
- New public Security Overview page at `/security`.
- Landing page footer links to Privacy, Terms, and Security.
- MoneyTracker logo in `AuthShell` (Login and Register) links back to `/`.
- Public trust pages are accessible to both logged-in and logged-out visitors.
- Authenticated application routes and navigation were fully preserved.

**Files included in commit `3bad3ce`:**
- `frontend/src/App.tsx`
- `frontend/src/components/AuthShell.tsx`
- `frontend/src/components/TrustPageShell.tsx`
- `frontend/src/pages/Landing.tsx`
- `frontend/src/pages/Privacy.tsx`
- `frontend/src/pages/Terms.tsx`
- `frontend/src/pages/Security.tsx`

### Commit 8ab1bab — Frontend Authentication UX Improvements (Task 3)
Task 3 was implemented, verified, committed, and pushed to `main`.
**Files changed in commit `8ab1bab`:**
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/Register.tsx`

**Delivered behavior:**
- **Enumeration-resistant HTTP 401 login feedback:** Displays uniform `"Invalid email or password. Please try again."` for any 401 failure, never exposing account existence.
- **Network disconnection handling:** Catches offline/unreachable server states (`!err.response`) with `"Unable to connect to the server. Please check your connection and try again."`
- **HTTP 429 rate-limit handling:** Displays backend rate-limiter message (`err.response.data.error` / `message`) or safe fallback (`"Too many login attempts. Please try again later."` / `"Too many attempts. Please try again later."`).
- **HTTP 500+ generic handling:** Masks internal server/stack traces with safe generic messages (`"An unexpected error occurred while signing in. Please try again."` / `"An unexpected error occurred. Please try again."`).
- **Safe 400 validation-message preservation:** Preserves legitimate backend registration validation details (e.g. attempt counts remaining, invalid code, expired code, code invalidated).
- **Accessible auth status/error live regions:** Added `role="alert"` / `aria-live="assertive"` to error containers and `role="status"` / `aria-live="polite"` to success/notice containers in both `Login.tsx` and `Register.tsx`.
- **Updated Step 2 password copy:** Renamed password label to `"Set account password"` and added helper text `"Choose a password you will use to sign in to MoneyTracker."`
- **Scoped error helper:** `getRegisterErrorMessage` locally defined inside `Register.tsx` to handle errors cleanly without bloating shared modules.

**Verification performed:**
- `npm run build` (`tsc -b && vite build`) succeeded with exit code 0.
- `git diff --check` passed with 0 errors or whitespace issues.
- Confirmed only the two approved frontend files were modified in commit `8ab1bab`.

### Commit 95fd76f — First-Time User Onboarding Checklist on Dashboard (Task 4)
Task 4 was implemented, verified, committed, and pushed to `main`.
**Files changed in commit `95fd76f`:**
- `frontend/src/components/OnboardingChecklist.tsx` (new)
- `frontend/src/pages/Dashboard.tsx` (modified)

**Delivered behavior:**
- **Loading-state guard:** Checklist is hidden while Dashboard data is being fetched (`loading === true`).
- **Live-derived completion:** Step completion is dynamically derived from live data (`accountsCount > 0`, `expensesCount > 0`, `subscriptionsCount > 0`). No artificial completion flags or duplicate database records are stored.
- **Three actionable steps:**
  1. "Add an initial balance or account" linking to `/balances`
  2. "Record your first expense" linking to `/activity`
  3. "Track a recurring subscription" linking to `/subscriptions`
- **Accessible progress tracking:** Visual progress bar paired with `role="progressbar"`, `aria-valuemin={0}`, `aria-valuemax={3}`, `aria-valuenow={completedCount}`, and dynamic `aria-valuetext`.
- **Automatic collapse/hiding:** The checklist automatically hides from view once all 3 onboarding steps are completed (`allCompleted === true`).
- **User-scoped local dismissal:** Dismissal choice is stored in `localStorage` scoped strictly to the authenticated user's email (`moneytracker_onboarding_dismissed_${userEmail}`). No global fallback key is created when email is absent.
- **Cross-device completion:** While dismissal is device-local, task completion is server-backed and thus universal across all browsers and devices.
- **Preserved existing dashboard:** Sits cleanly between Dashboard header and Total Balance card without altering any existing widgets, cards, charts, calculations, or responsive styles.

**Verification performed:**
- `npm run build` (`tsc -b && vite build`) passed with exit code 0.
- `git diff --check` passed with 0 errors or whitespace issues.
- Task 4 was committed as `95fd76f` and pushed to `origin/main`.

### Commit 7289d83 — Actionable Empty States Across Primary Views (Task 5)
Task 5 was implemented, verified, committed, and pushed to `main`.
**Files changed in commit `7289d83`:**
- `frontend/src/pages/Balance.tsx`
- `frontend/src/pages/Expenses.tsx`
- `frontend/src/pages/Subscriptions.tsx`
- `frontend/src/pages/Notes.tsx`

**Delivered behavior:**
- **Balances:** Replaced static "No accounts found." with an actionable empty-state card featuring the `Wallet` icon, title "No accounts yet", descriptive copy, and a primary "Add your first account" CTA. Clicking the CTA smoothly scrolls to the inline Add New Account form and focuses the Account Name input via typed ref.
- **Activity:** Uses the complete combined activity collection (`activityItems`, encompassing both expenses and account actions: deposits, withdrawals, transfers) to distinguish states:
  - *True first-use:* when `activityItems.length === 0`, renders an onboarding card with `Receipt` icon, title "No activity recorded yet", description, and primary "Log your first expense" CTA that smoothly scrolls to and focuses the Amount input.
  - *Filtered no-results:* when `activityItems.length > 0 && filteredActivity.length === 0`, renders a filter empty card with `Filter` icon, title "No activity matches your filters", description, and a "Clear all filters" CTA calling `clearFilters()`.
- **Subscriptions:**
  - *True first-use:* when `subscriptions.length === 0`, the Active Subscriptions section displays an actionable onboarding card with `Repeat` icon, title "No subscriptions tracked yet", description, and primary "Add a subscription" CTA that smoothly scrolls to and focuses the Subscription Name input.
  - *Non-onboarding fallback:* when subscriptions exist but none are active (`subscriptions.length > 0 && activeSubscriptions.length === 0`), displays subtle "No active subscriptions." fallback rather than the onboarding CTA.
  - *Cancelled subscriptions:* preserves subtle "No cancelled subscriptions." fallback.
- **Notes:** Cleanly distinguishes states:
  - *True first-use:* when `notes.length === 0`, renders an onboarding card with `NotebookText` icon, title "No notes yet", description, and primary "Create a note" CTA that smoothly scrolls to and focuses the Note Title input.
  - *Filtered no-results:* when `notes.length > 0 && filteredNotes.length === 0`, renders a filter empty card with `NotebookText` icon, title "No notes match the selected filters", description, and a "Reset filters" CTA calling `resetFilters()`.
- **Preserved existing views:** All existing tables, cards, view modes (comfortable/compact/list), modals (edit, delete, actions), charts, summaries, PDF exports, and pagination remain completely preserved when records exist.
- **Design & Accessibility:** Semantic headings (`<h3>`), native `button type="button"`, decorative `aria-hidden="true"` icons, keyboard accessibility with visible focus rings, and Tailwind light/dark styling matching the existing application aesthetic.

**Verification performed:**
- `npm run build` (`tsc -b && vite build`) passed with exit code 0.
- `git diff --check` passed with 0 errors or whitespace issues.
- Task 5 was committed as `7289d83` and pushed to `origin/main`.

### Commit 67af4ce — Global 401 Session-Expiry Handling (Task 6)
Task 6 was implemented, verified, committed, and pushed to `main`.
**Files changed in commit `67af4ce`:**
- `frontend/src/lib/api.ts`
- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/pages/Login.tsx`

**Delivered behavior:**
- **Module-level response interceptor:** Registered a singleton Axios response interceptor that always returns `Promise.reject(error)` on error, never swallowing errors, retrying, or leaving requests unresolved.
- **Strict 401 qualification:** Treats errors as session expiry only when status is 401, URL is not `/auth/login`, and an `Authorization` header or stored token is present. Unauthenticated public requests (e.g. registration) reject to their page handlers without triggering expiry.
- **Concurrent burst duplicate protection:** First qualifying 401 sets module lock `isHandlingSessionExpiry`, clears stored token via `setAuthToken(null)`, schedules a 1500 ms defensive reset timeout, invokes the registered session-expiry handler once, and rejects the original request. Subsequent concurrent 401s reject immediately without duplicate token clearance or navigation.
- **Lock reset:** Resets lock immediately upon successful login when `setAuthToken(token)` receives a non-null token (clearing any pending timeout), and independently via the 1500 ms defensive timeout.
- **Router-context handler registration:** `AuthProvider` uses `useNavigate` and `useLocation` to register a session-expiry callback that captures the current internal path (`${location.pathname}${location.search}${location.hash}`), calls `logout()`, and navigates with `replace: true` to `/login` passing state with `sessionExpiredMessage` and `from`. Unregisters on unmount/re-render.
- **Safe return path sanitization:** `Login.tsx` implements local `sanitizeReturnPath` helper rejecting non-strings, protocol-relative paths (`//`), `/`, `/login`, `/register`, `/privacy`, `/terms`, and `/security`, safely defaulting to `/dashboard` while preserving valid query parameters and hash anchors.
- **Accessible banner precedence:** In `Login.tsx`, alert rendering prioritizes: 1. login `error` banner > 2. amber `sessionExpiredMessage` banner (`role="alert"`, `aria-live="assertive"`) > 3. `successMessage` banner. A failed login replaces the session-expired notice with the invalid-credentials error.

**Verification performed:**
- `npm run build` (`tsc -b && vite build`) passed with exit code 0.
- `git diff --check` passed with 0 errors or whitespace issues.
- Zero lint errors or warnings were introduced by Task 6.
- Task 6 was committed as `67af4ce` and pushed to `origin/main`.

### Commit ae9b1b0 — Visible User Feedback & Founder Contact Paths (Task 7)
Task 7 was implemented, verified, committed, and pushed to `main`.
**Files changed in commit `ae9b1b0`:**
- `frontend/src/components/Layout.tsx`
- `frontend/src/pages/Settings.tsx`

**Delivered behavior:**
- **Persistent Desktop Utility Link:** Added a visible "Feedback & Support" link in the authenticated desktop sidebar utility area above the logout button, styled with `Mail` icon, accessible hover states, and direct mailto link: `mailto:founder@moneytracker.online?subject=Money%20Tracker%20Feedback`.
- **Mobile Drawer Support Link:** Added matching "Feedback & Support" link in the mobile navigation drawer that automatically closes the drawer (`onClick={() => setMobileMenuOpen(false)}`) when activated.
- **Dedicated Settings Card:** Added a comprehensive "Feedback & Support" card directly above the Danger zone in `Settings.tsx`, featuring an emerald `Mail` badge, descriptive helper text, explicit display of `founder@moneytracker.online`, and a primary "Send email" CTA button pointing to the identical mailto URI.
- **Design & Theme Alignment:** Fully integrated with Tailwind light/dark theme tokens, subtle borders, high-contrast readable typography, and keyboard focus outlines without altering any global routes, dependencies, or backend services.

**Verification performed:**
- `npm run build` (`tsc -b && vite build`) passed with exit code 0.
- `git diff --check` passed with 0 errors or whitespace issues.
- Confirmed only the two approved frontend files were included in commit `ae9b1b0`.
- Task 7 was committed as `ae9b1b0` and pushed to `origin/main`.

### Commit a28653b — Modernize README to PostgreSQL, Supabase, and Railway Architecture (Task 8)
Task 8 was implemented, verified, committed, and pushed to `main`.
**Files changed in commit `a28653b`:**
- `README.md`

**Delivered behavior:**
- **Title and Subtitle:** Replaced legacy "MySQL" reference with "PostgreSQL (Supabase / Docker)".
- **Overview:** Updated stack description to PostgreSQL; clearly distinguished production hosting (Express API on Railway connected to managed PostgreSQL on Supabase) from local development (local PostgreSQL container via Docker Compose).
- **Tech Stack Table:** Updated Database row to "PostgreSQL (Supabase in production, Docker in local dev)" and Deployment row to "Railway (API), Supabase (PostgreSQL)".
- **Project Structure Tree:** Added `docker-compose.postgres.yml`, `.env.example`, `frontend/.env.example`, and the `docs/` architecture & historical migration manuals.
- **Prerequisites:** Removed outdated MySQL requirement; specified Docker & Docker Compose (or local PostgreSQL 16+) and Node.js v18+.
- **Step-by-Step Local Setup:** Added explicit instructions for copying both `.env.example` files, starting local PostgreSQL via `docker compose -f docker-compose.postgres.yml up -d`, and deploying Prisma migrations via `npx prisma migrate deploy` prior to running the backend API (port 4000) and frontend client (port 5173).
- **Environment Variables Documentation:** Updated backend default port to `PORT=4000`, provided accurate PostgreSQL connection examples (`DATABASE_URL`, `DIRECT_URL`) for both local Docker and Supabase production reference format, and documented frontend `VITE_API_URL=http://localhost:4000`.
- **Database & Prisma Section:** Documented PostgreSQL provider, Supabase connection pooling (port 6543 via PgBouncer for application queries, direct session port 5432 for migrations), and the `npm run db:validate` validation script.
- **Deployment Architecture:** Documented the decoupled production infrastructure (Railway hosting the Express API running `npm start` which deploys migrations before launching the web server, and Supabase hosting PostgreSQL). Documented all required Railway production variables (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `FRONTEND_URL`, `PORT`, `NODE_ENV`).
- **Asset Integrity:** Preserved all 10 screenshot references (`screenshots/*.png`) and relative documentation links without alteration.

**Verification performed:**
- `git diff --check` passed with 0 errors or whitespace issues.
- `git diff --stat`: `1 file changed, 139 insertions(+), 86 deletions(-)`.
- Confirmed only `README.md` was modified in commit `a28653b`.
- Task 8 was committed as `a28653b` and pushed to `origin/main`.

*No application code, database schemas, migrations, package dependencies, Docker containers, deployment configs, or `.env` files were modified.*

### Commit e27c6d0 — Safe Personal Data Export in JSON and CSV Formats (Task 9)
Task 9 was implemented, reviewed locally, verified with clean builds, committed, and pushed to `main`.
**Files changed in commit `e27c6d0`:**
- `backend/follow-the-money-api/src/controllers/userController.ts`
- `backend/follow-the-money-api/src/middleware/rateLimiter.ts`
- `backend/follow-the-money-api/src/routes/userRoutes.ts`
- `frontend/src/pages/Settings.tsx`

**Delivered behavior:**
- **Strict User-Scoped Extraction:** Implemented `exportUserData` in `userController.ts`, fetching 6 user entities in parallel via `Promise.all` (`User`, `Account`, `Expense`, `Subscription`, `Note`, `AccountAction`), all strictly constrained by `where: { userId }` from authenticated `req.user.userId`.
- **Credential & Secret Protection:** Excluded sensitive fields (`passwordHash`, `emailVerificationCode`, `pendingEmailChange`) via explicit Prisma `select` projection on the `User` model.
- **Dual Export Formats:**
  - *Full JSON Archive (`?format=json`):* Full structured data backup with metadata (`version: "1.0"`, `exportedAt`, `profile`, `accounts`, `expenses`, `subscriptions`, `notes`, `accountActions`).
  - *CSV Activity Ledger (`?format=csv`):* Chronological spreadsheet-compatible ledger flattening expenses, account actions (deposits, withdrawals, transfers), subscriptions, and notes with standard columns: `Date`, `Type`, `Account`, `Category / Target`, `Description`, `Amount`, `Currency`, `Status`.
- **Formula & CSV Injection Sanitization (CWE-1236):** `sanitizeCsvField` escapes dangerous leading characters (`=`, `+`, `-`, `@`, `\t`, `\r`) by prepending a single quote `'` before applying RFC 4180 double-quote escaping, protecting spreadsheet users against malicious macro execution.
- **Anti-Caching Headers:** Configured `Cache-Control: no-store, no-cache, must-revalidate, private` and `Pragma: no-cache` so personal export files are never cached by browsers or intermediate proxies.
- **Abuse Prevention / Rate Limiting:** Added `exportLimiter` in `rateLimiter.ts` (5 requests per 15 minutes per IP) protecting `GET /me/export` behind `requireAuth`.
- **Settings UI Integration:** Added a "Data Portability & Export" card in `Settings.tsx` directly above the Danger Zone with dedicated buttons for JSON and CSV downloads.
- **Frontend Download Handling & Accessibility:** Features independent loading indicators ("Generating JSON...", "Generating CSV..."), button disabling during active downloads, blob-level error extraction for 429 and 500 responses, accessible live feedback banners (`role="status"` / `role="alert"`), and clean object URL revocation.

**Verification performed:**
- `npm run build` in `backend/follow-the-money-api` (`tsc`) passed with exit code 0.
- `npm run build` in `frontend` (`tsc -b && vite build`) passed with exit code 0.
- `git diff --check` passed with 0 errors or whitespace issues.
- `git diff --stat`: `4 files changed, 424 insertions(+), 1 deletion(-)`.
- Confirmed only the four approved files were included in commit `e27c6d0`.
- Task 9 was committed as `e27c6d0` and pushed to `origin/main`.

### Commit 4064fe0 — Database Connectivity Check in /health Endpoint (Task 10)
Task 10 was implemented, reviewed locally, verified with clean builds, committed, and pushed to `main`.
**Files changed in commit `4064fe0`:**
- `backend/follow-the-money-api/src/app.ts`

**Delivered behavior:**
- **Asynchronous Health Handler:** Replaced static JSON response on `GET /health` with an async handler that pings the live database.
- **Lightweight Connection Ping:** Executes `prisma.$queryRaw` with `SELECT 1` inside a `Promise.race` bounded by an explicit 3,000 ms timeout.
- **Timer Cleanup:** Clears the timeout handle with `clearTimeout(timer)` on both success and error resolution to prevent unneeded event loop retention.
- **Cache-Prevention Headers:** Configured `Cache-Control: no-store, no-cache, must-revalidate` so health status is never cached by proxies or CDNs.
- **Healthy Path (HTTP 200):** Returns `{ status: "ok", message: "Express + Prisma + PostgreSQL ready", database: "connected" }`.
- **Unhealthy / Timeout Path (HTTP 503):** Logs internal error server-side (`console.error`) and returns sanitized `{ status: "error", message: "Database connectivity check failed", database: "disconnected" }` without leaking connection strings, credentials, or internal stack traces.
- **Compatibility:** Fully compatible with Railway deployment health probes and preserves test assertion expectations in `test-e2e-api.ts`.

**Verification performed:**
- `npm run build` in `backend/follow-the-money-api` (`tsc`) passed with exit code 0.
- `git diff --check` passed with 0 errors or whitespace issues.
- `git diff --stat`: `1 file changed, 27 insertions(+), 5 deletions(-)`.
- Confirmed only `backend/follow-the-money-api/src/app.ts` was included in commit `4064fe0`.
- Task 10 was committed as `4064fe0` and pushed to `origin/main`.

### Commit 87f176d — Opt-In, Privacy-Preserving Claude Financial Insights (Task 11)
Task 11 was implemented, reviewed locally, verified with clean builds, committed, and pushed to `main`.
**Files changed in commit `87f176d`:**
- `backend/follow-the-money-api/src/services/aiSanitizer.service.ts` (new)
- `backend/follow-the-money-api/src/controllers/aiInsightsController.ts` (new)
- `backend/follow-the-money-api/src/routes/aiInsightsRoutes.ts` (new)
- `frontend/src/pages/Settings.tsx` (modified)

**Delivered behavior:**
- **Zero-PII Aggregate Sanitization Service:** `computeUserAggregateMetrics(userId)` in `aiSanitizer.service.ts` extracts strictly minimized numeric aggregates scoped to the authenticated user ID: 30-day grouped category spending totals, top 5 spending categories with percentage shares, active subscription count, and normalized monthly subscription commitment. Completely omits descriptions, notes, account names, payees/merchants, or profile info at the database query level.
- **Preview Endpoint (`GET /me/ai-insights/preview`):** Returns the exact sanitized JSON aggregate metrics object so users can inspect precisely what would be evaluated before opting in.
- **Strict Opt-In Enforced (`POST /me/ai-insights/generate`):** Requires explicit `optInConfirmed === true` in the request body; returns HTTP 403 Forbidden (`{ error: "AI insights feature requires explicit opt-in consent." }`) if consent is omitted or false.
- **Native Claude API Integration:** Uses Node native `fetch` to Anthropic (`https://api.anthropic.com/v1/messages`), transmitting strictly `JSON.stringify(metrics, null, 2)` (numeric aggregates only).
- **Graceful Unconfigured Fallback:** Returns HTTP 501 Not Implemented (`{ error: "Claude AI service is not configured. ANTHROPIC_API_KEY is not set on this server.", configured: false }`) if `ANTHROPIC_API_KEY` is not present in the runtime environment.
- **Strict Rate Limiting & Anti-Caching:** Added `aiLimiter` in `aiInsightsController.ts` enforcing a 10 requests per hour per IP cap. Endpoints set `Cache-Control: no-store, no-cache, must-revalidate, private` to prevent intermediate caching.
- **Settings UI Integration:** Added an "AI Insights (Optional)" card in `Settings.tsx` below Data Portability & Export:
  - Toggle defaults to OFF (`false`), scoped to the user email in `localStorage`.
  - Plain-language privacy summary explicitly contrasts what Claude sees vs what Claude never sees.
  - "Preview data" modal renders the exact formatted JSON payload for full user transparency.
  - "Generate insights" action button with loading states (`Analyzing aggregates...`), dismissible summary observations, and error handling for 429 rate limits and 501 unconfigured states.
  - "Revoke consent" instant action immediately deletes local consent, clears cached summaries, and closes open modals.
  - Fully accessible with ARIA live feedback banners (`role="status"` / `role="alert"`).

**Verification performed:**
- `npm run build` in `backend/follow-the-money-api` (`tsc`) passed with exit code 0.
- `npm run build` in `frontend` (`tsc -b && vite build`) passed with exit code 0.
- `git diff --check` passed with 0 errors or whitespace issues.
- `git diff --stat`: `4 files changed, 510 insertions(+)`.
- Confirmed only the four approved files were included in commit `87f176d`.
- Task 11 was committed as `87f176d` and pushed to `origin/main`.

### Commit c216aac — Task v2 Phase 1: Design Tokens, UI Primitives & Route Code-Splitting
Task v2 Phase 1 was implemented, reviewed locally, verified with clean builds, committed, and pushed to `main`.
**Files changed in commit `c216aac`:**
- `frontend/index.html` (modified)
- `frontend/src/index.css` (modified)
- `frontend/src/App.tsx` (modified)
- `frontend/src/pages/Expenses.tsx` (modified)
- `frontend/src/components/ui/` (11 new primitives: `Badge.tsx`, `Button.tsx`, `Card.tsx`, `Dialog.tsx`, `EmptyState.tsx`, `GlassCard.tsx`, `Input.tsx`, `Select.tsx`, `Skeleton.tsx`, `StatCard.tsx`, `index.ts`)

**Delivered behavior:**
- **Typography & Font Tokens:** Added Google Fonts `Plus Jakarta Sans` (UI text) and `JetBrains Mono` (numeric tabular figures) with `display=swap` and preconnect tags.
- **Tailwind v4 Theme Tokens:** Configured `@theme` tokens in `index.css` for Obsidian canvas (`--color-obsidian-950` to `700`), Mint telemetry accents (`--color-mint-400` to `600`), Coral spend accents (`--color-coral-400` to `600`), and subtle elevation shadows (`--shadow-card`, `--shadow-glow-mint`).
- **Atomic UI Primitives:** Created 10 reusable UI primitives matching precision FinTech design patterns with complete dark mode and keyboard accessibility support.
- **Route Code-Splitting:** Split all application routes in `App.tsx` via `React.lazy()` with a branded `Skeleton` loading fallback.
- **PDF Export Isolation:** Replaced static imports of `jspdf` and `jspdf-autotable` in `Expenses.tsx` with dynamic `import()` to isolate 430 kB of PDF parsing code into deferred chunks. Initial bundle dropped from 931.65 kB to 198.17 kB (a 78.7% reduction).

**Verification performed:**
- `npm run build` (`tsc -b && vite build`) passed with exit code 0.
- `git diff --check` passed with 0 errors or whitespace issues.
- Committed as `c216aac` and pushed to `origin/main`.

### Commit 5caddf0 — Task v2 Phase 2: App Shell & Navigation Overhaul
Task v2 Phase 2 was implemented, reviewed locally, verified with clean builds, committed, and pushed to `main`.
**Files changed in commit `5caddf0`:**
- `frontend/src/components/MobileBottomNav.tsx` (new)
- `frontend/src/components/QuickAction.tsx` (new)
- `frontend/src/components/Layout.tsx` (modified)
- `frontend/src/components/AuthShell.tsx` (modified)

**Delivered behavior:**
- **Obsidian Desktop Sidebar:** Migrated desktop sidebar in `Layout.tsx` to Obsidian palette (`#070b14`), hairline border (`border-white/8`), active mint badges with glowing indicators, and a streamlined workspace footer.
- **Mobile Bottom Navigation Dock:** Created `MobileBottomNav.tsx` with frosted glass (`bg-white/90 backdrop-blur-xl dark:bg-[#070b14]/90`), safe-area bottom padding (`env(safe-area-inset-bottom)`), 4 primary destinations (`/dashboard`, `/balances`, `/activity`, `/subscriptions`), and a slide-up "More" sheet for `/notes`, `/settings`, Feedback & Support, Appearance (ThemeToggle), and Logout. Dismissible via `Escape` key and backdrop click.
- **Quick Action ("+ New") Trigger:** Created `QuickAction.tsx` supporting full-width sidebar and compact mobile header variants. Displays an accessible modal dialog offering 1-click shortcuts to Log an Expense (`/activity`), Add an Account (`/balances`), Track Subscription (`/subscriptions`), and Write a Note (`/notes`).
- **Streamlined Mobile Top Bar:** Replaced legacy mobile hamburger drawer in `Layout.tsx` with a low-profile header containing brand logo, `<QuickAction variant="compact" />`, and `<ThemeToggle />`.
- **Main View Safe Padding:** Added `pb-28 lg:pb-8` to `<main>` in `Layout.tsx` so mobile pages are never occluded by the bottom navigation dock.
- **AuthShell Refresh:** Upgraded marketing panel in `AuthShell.tsx` to Obsidian `#070b14` with ambient radial gradients, subtle grid lines, Plus Jakarta typography, and glassmorphic cards, while modernizing the right form container with `rounded-[32px]` and dark mode contrast.
- **Scope & Safety:** Preserved all existing routes, auth redirection, and logout logic. Zero backend, database schema, migration, or external dependency changes.

**Verification performed:**
- `npm run build` (`tsc -b && vite build`) passed with exit code 0.
- `git diff --check` passed with 0 errors or whitespace issues.
- `git diff --stat`: `4 files changed, 698 insertions(+), 183 deletions(-)`.
### Commit e140c01 — Task v2 Phase 3: Dashboard & Balances Views Overhaul
Task v2 Phase 3 was implemented, reviewed locally, verified with clean builds, committed, and pushed to `main`.
**Files changed in commit `e140c01`:**
- `frontend/src/components/OnboardingChecklist.tsx` (modified)
- `frontend/src/pages/Balance.tsx` (modified)
- `frontend/src/pages/Dashboard.tsx` (modified)
- `frontend/src/utils/formatMoney.ts` (modified)
- `frontend/src/components/balances/AccountActionDialog.tsx` (new)
- `frontend/src/components/balances/AccountCard.tsx` (new)
- `frontend/src/components/balances/EditAccountDialog.tsx` (new)
- `frontend/src/components/balances/ViewSwitcher.tsx` (new)

**Delivered behavior:**
- **Dashboard Hero Banner:** Redesigned hero balance banner with dual-currency support, `JetBrains Mono` tabular figures, Obsidian card tokens (`dark:bg-[#0d1526]`, `dark:border-white/10`), ambient radial glow, and `Skeleton` shimmer loading states (eliminating legacy plain-text "Loading...").
- **Dashboard Telemetry Metric Cards:** Replaced private inline `StatCard` helper with atomic `src/components/ui/StatCard.tsx` and `Skeleton.tsx` for Subscription Overview, Expenses This Month (coral accent), and Top Spending Category (amber accent).
- **Onboarding Checklist Modernization:** Upgraded container styling in `OnboardingChecklist.tsx` to Obsidian palette (`dark:bg-[#0d1526]`, `dark:border-white/10`) with glowing mint progress bar and button hover states while preserving live-derived step completion and user-scoped dismissal.
- **Combined Balances Hero Card:** Overhauled combined balance overview on `Balance.tsx` with Obsidian tokens, dual-currency tabular numbers, and shimmer loading state.
- **Quick Action Trigger Cards:** Redesigned Deposit, Withdraw, and Transfer trigger cards with interactive v2 card styling, telemetry icons (emerald, rose, blue), and smooth hover lifts.
- **Accessible Action Dialogs:** Replaced hand-rolled fixed overlays with the accessible v2 `Dialog` primitive for both `AccountActionDialog` (Deposit, Withdraw, and cross-currency Transfer) and `EditAccountDialog` (details editing and zero-balance deletion guard).
- **Add New Account Form:** Encapsulated inline creation form within a v2 `Card` using standard `Input`, `Select`, and `Button` primitives with ref focus preservation.
- **Account Card Presentations:** Extracted modular `AccountCard.tsx` providing both Comfortable (grid) and Compact (dense tiles) variants with account type `Badge`, `JetBrains Mono` tabular figures, secondary currency converted balances, and reorder controls.
- **View Switcher:** Extracted `ViewSwitcher.tsx` providing a sleek segmented control for Comfortable, Compact, and Table List view modes with `localStorage` persistence.
- **Clean Shared Utility:** Centralized `convertAmount` and `ExchangeRates` into `formatMoney.ts` to satisfy React Fast Refresh lint rules.
- **Scope & Safety:** Preserved 100% of data-fetching endpoints, calculations, exchange rate logic, reorder API contracts, deletion safety rules, and responsive navigation.

**Verification performed:**
- `npm run build` (`tsc -b && vite build`) passed with exit code 0.
- `git diff --check` passed with 0 errors or whitespace issues.
- `git diff --stat`: `8 files changed, 1139 insertions(+), 970 deletions(-)`.
- Committed as `e140c01` and pushed to `origin/main`.

### Commit 2cb4df7 — Task v2 Phase 4: Activity & Subscriptions Views Overhaul
Task v2 Phase 4 was implemented, reviewed locally, verified with clean builds, committed, and pushed to `main`.
**Files changed in commit `2cb4df7`:**
- `frontend/src/components/activity/ActivityLedgerTable.tsx` (new)
- `frontend/src/components/activity/EditExpenseDialog.tsx` (new)
- `frontend/src/components/activity/ExpenseFilters.tsx` (new)
- `frontend/src/components/subscriptions/RenewalTimeline.tsx` (new)
- `frontend/src/components/subscriptions/SubscriptionCard.tsx` (new)
- `frontend/src/pages/Expenses.tsx` (modified)
- `frontend/src/pages/Subscriptions.tsx` (modified)

**Delivered behavior:**
- **Activity & Transaction Ledger Table:** Extracted `ActivityLedgerTable.tsx` rendering a high-precision financial ledger table for desktop and modular card tiles for mobile with `JetBrains Mono` tabular figures, directional amount color-coding (rose spend, emerald deposit, amber withdrawal, blue transfer), category/type status `Badge` indicators, and converted secondary currency values.
- **Filter Ledger Bar & Real-Time Cashflow Telemetry:** Extracted `ExpenseFilters.tsx` featuring category and account selectors, responsive date preset chips (`All time`, `Today`, `Yesterday`, `This month`, `Last month`, `Custom range`), activity type filter chips, active filter counter badge, filter reset button, and real-time cashflow telemetry banner calculating converted Expenses, Deposits, Net Cashflow (`+` / `−`), and Transfers Out.
- **Accessible Edit Expense Dialog:** Extracted `EditExpenseDialog.tsx` wrapping the accessible v2 `Dialog` primitive with body scroll locking, Escape key dismissal, form validation, and dark mode contrast tokens.
- **Dynamic PDF Export Isolation Preserved:** 100% of PDF export logic with lazy-loaded dynamic imports (`jspdf` and `jspdf-autotable`) remains functional and fully code-split without impacting the core bundle.
- **Subscriptions Renewal Timeline Telemetry:** Extracted `RenewalTimeline.tsx` calculating normalized monthly outflow commitments, upcoming renewals due within 7 days, renewals due within 30 days, active service counts, and an immediate next renewal alert pill showing the earliest upcoming renewal service name, amount, and formatted date.
- **Modular Subscription Cards:** Extracted `SubscriptionCard.tsx` rendering desktop table rows and mobile cards with renewal status badges, billing cadence tags, "Due soon" alert indicators, and accessible cancellation triggers with loading states.
- **Active & Cancelled Tabbed Navigation:** Added segmented tab controls with live count badges on `Subscriptions.tsx` for clean organization.
- **Shimmer Skeleton Loading:** Replaced legacy plain text `"Loading..."` with animated v2 `Skeleton` shimmer placeholders across both primary views.
- **Empty State Continuity:** Maintained actionable empty states with smooth scrolling and input focus triggers for first-time onboarding.
- **Scope & Safety:** Zero backend changes, zero database schema or migration modifications, zero new dependencies, and zero changes to other pages.

**Verification performed:**
- `npm run build` (`tsc -b && vite build`) passed with exit code 0.
- `npm --prefix backend/follow-the-money-api run build` passed with exit code 0.
- `git diff --check` passed with 0 errors or whitespace issues.
- `git diff --stat`: `7 files changed, 2020 insertions(+), 1186 deletions(-)`.
- Committed as `2cb4df7` and pushed to `origin/main`.

### Commit 46fbc2d — Task v2 Phase 5: Notes & Settings Views Overhaul
Task v2 Phase 5 was implemented, reviewed locally, verified with clean builds, committed, and pushed to `main`.
**Files changed in commit `46fbc2d`:**
- `frontend/src/components/notes/NoteCard.tsx` (new)
- `frontend/src/components/notes/NoteEditorDialog.tsx` (new)
- `frontend/src/components/notes/NoteFilters.tsx` (new)
- `frontend/src/components/settings/SettingsSection.tsx` (new)
- `frontend/src/components/settings/ExportDataCard.tsx` (new)
- `frontend/src/components/settings/AiInsightsCard.tsx` (new)
- `frontend/src/components/settings/DangerZoneCard.tsx` (new)
- `frontend/src/pages/Notes.tsx` (modified)
- `frontend/src/pages/Settings.tsx` (modified)

**Delivered behavior:**
- **Notes Telemetry & StatCards:** Top metric row with 4 summary `StatCard` indicators (Total Notes, Open Reminders, Pending Receivables, Pending Obligations/Payables) calculating live counts and status.
- **Notes Search & Multi-Tag Filter Bar:** Extracted `NoteFilters.tsx` providing real-time full-text substring search across titles, descriptions, and person names, combined with interactive Status chips (`All`, `Open`, `Done`, `Cancelled`) and Type chips (`All`, `General`, `To Receive`, `To Pay`, `Reminder`) with dynamic `tabular-nums` counter badges and instant reset.
- **Obsidian FinTech Note Cards:** Extracted `NoteCard.tsx` rendering Obsidian styled tiles with type badges, status badges, recurrence indicators, amounts in `JetBrains Mono` tabular figures, person metadata, due dates, update timestamps, and accessible edit/delete action triggers.
- **Accessible Note Editor Dialog:** Extracted `NoteEditorDialog.tsx` wrapping the v2 `Dialog` primitive for both creating and editing financial notes with client-side title and positive amount validation, semantic field grouping, and live error banners.
- **Settings Section Modular Architecture:** Extracted `SettingsSection.tsx` providing uniform section framing with iconography, descriptive headers, and WAI-ARIA accessible live alerts (`role="status"` and `role="alert"`).
- **Data Portability & Export Module:** Extracted `ExportDataCard.tsx` with dedicated JSON Archive and CSV Ledger download cards, preserving complete binary blob handling, dynamic filename stamping, rate limit (HTTP 429) messaging, and error blob JSON parsing.
- **Claude AI Spending Insights Module:** Extracted `AiInsightsCard.tsx` with accessible switch toggle, user-scoped `localStorage` opt-in persistence (`moneytracker_ai_insights_opt_in_${email}`), privacy guarantee checklist, sanitized aggregate JSON inspection dialog, and observation summaries.
- **Guarded Danger Zone Deletion:** Extracted `DangerZoneCard.tsx` safeguarding irreversible account deletion behind an explicit `"DELETE"` text confirmation modal using v2 `Dialog`.
- **Shimmer Skeleton Placeholders:** Replaced legacy plain text loading strings across both pages with multi-tile animated `Skeleton` shimmer layouts.
- **Scope & Safety:** Zero backend changes, zero database schema or migration alterations, zero new dependencies, and zero changes to other application pages.

**Verification performed:**
- `npm run build` (`tsc -b && vite build`) passed with exit code 0.
- `npm --prefix backend/follow-the-money-api run build` passed with exit code 0.
- `git diff --check` passed with 0 errors or whitespace issues.
- `git diff --stat`: `9 files changed, 2079 insertions(+), 1812 deletions(-)`.
- Committed as `46fbc2d` and pushed to `origin/main`.

---

## 3. Local Development Verified
The local development environment has been tested and verified operational:
- **Frontend server:** `http://localhost:5173` (Vite dev server)
- **Backend server:** `http://localhost:4000` (Express API)
- **Local database:** PostgreSQL in Docker on `localhost:5432` (`docker-compose.postgres.yml`)

**Verified local behavior:**
- Local frontend build (`tsc -b && vite build`) passed with exit code 0.
- Backend started successfully on port 4000.
- `http://localhost:4000/health` responded with healthy status (`{ status: "ok", database: "connected" }`).
- Docker PostgreSQL container was running and healthy.
- Registration email verification requests were dispatched and accepted by Resend.
- A new local user registration was completed end-to-end.
- A newly created local user successfully logged in and accessed the Dashboard.
- Local Docker PostgreSQL is completely separate from production Supabase database data.
- Browser errors originating from `chrome-extension://`, TronLink, password-manager encryption, or disconnected port objects were verified to be client browser-extension artifacts, not MoneyTracker application errors.

---

## 4. Important Authentication Findings
- **Registration code alone does not create a user:** Requesting a verification code stores a temporary hashed code record. The user account is only created in Step 2 when the code is verified and the user sets a password.
- **Login 401 behavior:** Returns `401 Unauthorized` with `{ error: "Invalid credentials" }` when the user does not exist locally or the password does not match.
- **Rate limiting active:**
  - Login limiter enforces 10 requests per 15 minutes per IP (`loginLimiter`).
  - Request code limiter enforces 5 requests per 15 minutes per IP (`requestCodeLimiter`).
  - Submit code limiter enforces 10 requests per 15 minutes per IP (`submitCodeLimiter`).
  - Export limiter enforces 5 requests per 15 minutes per IP (`exportLimiter`).
  - AI insights limiter enforces 10 requests per hour per IP (`aiLimiter`).
  - Local browser sessions share localhost IP behavior.
  - Rate limit counters reside in-memory; restarting only the local backend process clears local counters.
  - Do not weaken or disable rate limiting in production.
- **Frontend error handling resolved:**
  - In commit `8ab1bab`, `Login.tsx` and `Register.tsx` error handling was aligned with backend JSON responses (`{ error: "..." }`), while enforcing account-enumeration resistance on 401, catching offline states, handling 429 rate limits, masking 500 errors, and adding WAI-ARIA live region accessibility.

---

## 5. Ordered Product Roadmap

### Completed:
1. Public landing page (`/`).
2. Public Privacy, Terms, and Security trust pages (`/privacy`, `/terms`, `/security`).
3. Frontend Authentication UX Improvements (`8ab1bab`).
4. First-time user onboarding checklist on Dashboard (`95fd76f`).
5. Actionable empty states for Balances, Activity, Subscriptions, and Notes (`7289d83`).
6. Safe frontend session-expiry handling via global 401 Axios interceptor (`67af4ce`).
7. Visible user feedback/contact path (`founder@moneytracker.online`) (`ae9b1b0`).
8. Modernize README from MySQL to PostgreSQL, Supabase, and Railway architecture (`a28653b`).
9. Safe personal data export in JSON and CSV formats (`e27c6d0`).
10. Database connectivity verification in `/health` endpoint (`4064fe0`).
11. Opt-in, privacy-preserving Claude feature using minimized aggregate data only (`87f176d`).
12. Task v2 Phase 1: Design tokens, UI primitives & route code-splitting (`c216aac`).
13. Task v2 Phase 2: App shell and navigation overhaul (`5caddf0`).
14. Task v2 Phase 3: Dashboard and balances views overhaul (`e140c01`).
15. Task v2 Phase 4: Activity and subscriptions views overhaul (`2cb4df7`).
16. Task v2 Phase 5: Notes and settings views overhaul (`46fbc2d`).
17. Task v2 Phase 6: Public trust pages and final polish (`7a544a4`).

### Active Redesign Roadmap (Task v2 — Privacy-First FinTech UI):
- **Phase 1 (Completed — `c216aac`):** Design tokens (`index.css`), atomic UI primitives (`src/components/ui/*`), route code-splitting (`App.tsx`), and dynamic import PDF isolation.
- **Phase 2 (Completed — `5caddf0`):** Obsidian desktop sidebar, mobile bottom navigation dock (`MobileBottomNav.tsx`), QuickAction global trigger (`QuickAction.tsx`), AuthShell refresh.
- **Phase 3 (Completed — `e140c01`):** Dashboard & Balances Views (StatCard metric counters, modern balance cards, actionable dialogs).
- **Phase 4 (Completed — `2cb4df7`):** Activity & Subscriptions Views (Transactions table, badge filters, recurring billing telemetry).
- **Phase 5 (Completed — `46fbc2d`):** Notes & Settings Views (Obsidian notes grid, telemetry StatCards, security controls, AI insights cards).
- **Phase 6 (Completed — `7a544a4`):** Public Trust Pages & Final Polish (Landing, Privacy, Terms, Security, TrustPageShell, v2 Obsidian design tokens throughout).
- **Status:** **Full v2 Privacy-First FinTech UI Redesign (Phases 1–6) is 100% COMPLETE.**

### Next Planned Task:
- **Claude for Startups application materials:**
  - Review existing project achievements, verified architectural transitions (PostgreSQL, Supabase, Railway, Resend, Docker, privacy-preserving Claude insights, v2 UI), and draft truthful, grounded application responses.
  - Boundaries: Read-only audit and plan first; do not invent fictional metrics, false user numbers, or unverified claims; await explicit user approval before authoring documents.

---

## 6. Next-Task Boundaries (Claude for Startups Application Materials)
- Must begin with a read-only audit of project background, architecture, and application questions.
- Must not invent fictional metrics, unverified user counts, or inaccurate financial telemetry.
- Must ground all application answers in verified repository architecture and real features.
- Must wait for explicit user approval before authoring final application documents.

---

## 7. Mandatory Safety & Production Rules
- **Never display, read, copy, log, or commit `.env` values or secrets.**
- **Never expose passwords, tokens, API keys, verification codes, JWTs, or database URLs.**
- **Never access production database records or contact production APIs directly.**
- **Do not run production migrations casually.**
- **Never run `npx prisma db push` against production.**
- **Never run `prisma migrate reset` against production.**
- **Never manually edit `_prisma_migrations`.**
- **Railway Pre-deploy Command must remain empty.**
- **Railway Custom Start Command must remain `npm start`.**
- **Do not force-push.**
- **Do not install packages unless explicitly approved.**
- **Do not stage, commit, push, or deploy without explicit approval.**
- **Always review `git diff` and run `git diff --check` before staging or committing.**
- **Always make small, isolated, reviewable changes.**

---

# Architectural Baseline & Historical Handoff Information

## 8. Project Architecture
- **Frontend:** React 19 SPA built with Vite, TypeScript, Tailwind CSS 4, React Router DOM (v7), Context API (`AuthContext`), and Axios.
- **Backend:** Node.js, Express (v5), and TypeScript, using Prisma ORM for database access, `node-cron` for scheduled subscription billing/reminders, and Resend for transactional emails.
- **Production Hosting:** Railway hosting Express API (`follow-the-money-api`), pointing environment variables to Supabase PostgreSQL.
- **Production Database:** Supabase PostgreSQL:
  - Pooled connection (`port 6543`, `?pgbouncer=true`) for application runtime queries (`DATABASE_URL`).
  - Direct connection (`port 5432`) for Prisma migrations (`DIRECT_URL`).
- **Production Startup:** Backend starts via `npm start`, running `prisma migrate deploy && node dist/server.js`.

---

## 9. Active Environment File Paths (Names Only — No Secrets)
- **Backend Active Configuration:** `backend/follow-the-money-api/.env`
  - Variables referenced: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `FRONTEND_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `PORT`, `NODE_ENV`.
- **Frontend Active Configuration:** `frontend/.env`
  - Variables referenced: `VITE_API_URL`.
- **Safe Templates Tracked in Git:**
  - Root: `.env.example`
  - Backend: `backend/follow-the-money-api/.env.example`
  - Frontend: `frontend/.env.example`

---

## 10. Security & Hardening History
Completed in previous commit `e9eaa57`:
- Secure CSPRNG verification code generation (`crypto.randomInt`).
- Verification codes stored as SHA-256 hashes.
- Failed-attempt tracking with automatic invalidation after 5 failures.
- Route-level rate limiting on sensitive auth endpoints.
- Railway `trust proxy` configured for accurate IP rate limiting.
- Test-mode email bypass for automated security tests.
- Prisma migration deployment executed before backend process startup.
