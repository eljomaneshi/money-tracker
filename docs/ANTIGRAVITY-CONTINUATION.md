# Current Continuation State — 2026-10-08

## 1. Repository & Git State
- **Repository:** `eljomaneshi/money-tracker`
- **Branch:** `main`
- **Latest pushed commit:** `7289d83 feat(ui): add actionable empty states across primary views`
- **Local branch state:** Synchronized with `origin/main`.
- **Working tree:** Clean (except unstaged `docs/ANTIGRAVITY-CONTINUATION.md`).
- **Deployment state:** Commits `3bad3ce`, `8ab1bab`, `95fd76f`, and `7289d83` have not been deployed to production.
- **Rule:** Do not deploy without explicit later approval.

---

## 2. Completed Work

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

*No backend, database, Prisma schema, migration, package dependency, Docker, deployment, or `.env` files were modified.*

---

## 3. Local Development Verified
The local development environment has been tested and verified operational:
- **Frontend server:** `http://localhost:5173` (Vite dev server)
- **Backend server:** `http://localhost:4000` (Express API)
- **Local database:** PostgreSQL in Docker on `localhost:5432` (`docker-compose.postgres.yml`)

**Verified local behavior:**
- Local frontend build (`tsc -b && vite build`) passed with exit code 0.
- Backend started successfully on port 4000.
- `http://localhost:4000/health` responded with healthy status.
- Docker PostgreSQL container was running.
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

### Next Planned Task (Not Yet Approved or Implemented):
6. **Safe frontend session-expiry handling (via global 401 Axios interceptor):**
   - Implement a safe, global response interceptor in the Axios client configuration (`frontend/src/lib/api.ts`).
   - Automatically handle 401 Unauthorized errors caused by expired JWT sessions without crashing or hanging requests.
   - Clear authentication state, remove stale session tokens, and transition user to login with appropriate feedback.
   - Boundaries: Frontend-only, begin with a read-only audit and plan, and wait for explicit approval before modifying any files.

### Future Tasks (One at a Time):
7. Visible user feedback/contact path (`founder@moneytracker.online`).
8. Modernize README and documentation from outdated MySQL references to current PostgreSQL / Supabase / Railway architecture.
9. Evaluate safe personal data export (JSON / CSV).
10. Improve `/health` endpoint to verify database connectivity.
11. Only later evaluate an opt-in, privacy-preserving Claude feature using minimized aggregate data only.
12. Only after product improvements are complete, prepare truthful Claude Startup application materials.

---

## 6. Next-Task Boundaries
- Must begin with a read-only audit and plan of existing session-handling, token storage, and Axios interceptor setup before making changes.
- Must wait for explicit user approval before modifying any files.
- Must be frontend-only and focused on safe session-expiry handling.
- Must not alter backend logic, database behavior, migrations, dependencies, deployment, or environment files.

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
