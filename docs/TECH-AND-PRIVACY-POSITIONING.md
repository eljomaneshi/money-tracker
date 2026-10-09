# MoneyTracker — Technical & Privacy Positioning

## 1. Overview and Current Status
MoneyTracker is an unincorporated personal finance web application developed by a solo founder, not currently a registered company *(owner confirmed; verified in LICENSE and README.md)*. Deployed at `https://moneytracker.online`, the founder is currently the only active user; external adoption, beta cohorts, customer validation, and commercial revenue have not been established *(owner confirmed)*.

The product prioritizes privacy: users track multi-currency cashflow, subscriptions, and personal notes manually without bank credentials. MoneyTracker is strictly an organizational record-keeping tool and does not provide regulated financial, investment, credit, or tax advice *(verified in frontend/src/pages/Landing.tsx and Terms.tsx)*.

---

## 2. Architecture and Hosting
Decoupled client-server architecture:
- **Frontend Client:** React 19 SPA built with TypeScript, Vite, Tailwind CSS 4, and React Router DOM v7 *(frontend/package.json and README.md)*.
- **Backend API:** Express v5 TypeScript service (`follow-the-money-api`) with Prisma ORM on Railway *(backend/follow-the-money-api/package.json and README.md)*.
- **Database:** Managed PostgreSQL on Supabase (EU West region), using connection pooling for queries and direct connections for migrations. Database-level Row-Level Security (RLS) is not enabled *(README.md, docs/ANTIGRAVITY-CONTINUATION.md, and backend/follow-the-money-api/prisma/schema.prisma)*.
- **Cron & Email:** Internal `node-cron` schedule checks subscription renewals; transactional emails are sent via Resend *(src/cron/subscriptionCron.ts and emailService.ts)*.
- **Secrets Management:** Injected via Railway platform environment variables; local `.env` files are excluded from version control *(.gitignore and README.md)*.

---

## 3. Data Handled by Core Finance Features
MoneyTracker stores user-entered records and auth data *(backend/follow-the-money-api/prisma/schema.prisma)*:
- **Accounts & Balances:** Labels, categories (`BANK`, `CASH`, `CRYPTO`, `OTHER`), balances, currencies (`EUR`, `ALL`, `USD`, `GBP`), and sort orders *(frontend/src/pages/Balance.tsx)*.
- **Expenses & Actions:** Amounts, dates, category names, descriptions, and account links *(frontend/src/pages/Expenses.tsx)*.
- **Subscriptions:** Name, recurring price, cycle (`MONTHLY`, `YEARLY`), renewal date, status, and reminder timestamps *(frontend/src/pages/Subscriptions.tsx)*.
- **Notes:** Title, text, optional amount/counterparty, due date, category, status, and currency *(frontend/src/pages/Notes.tsx)*.
- **Auth & Profiles:** Email, bcrypt password hash, optional name, currency settings, notification flags, and SHA-256 verification code hashes *(backend/follow-the-money-api/src/controllers/auth.controller.ts)*.

MoneyTracker does not collect government IDs, payment card credentials, or online banking passwords *(frontend/src/pages/Privacy.tsx and Terms.tsx)*.

---

## 4. Current Security Controls
Verified implementation controls:
- **Password Hashing:** Passwords hashed with bcrypt (salt cost factor 10); raw passwords never stored *(backend/follow-the-money-api/src/controllers/auth.controller.ts)*.
- **CSPRNG Verification & Lockout:** 6-digit codes generated via `crypto.randomInt`, stored as SHA-256 hashes, valid for 10 minutes, locked out after 5 consecutive failed attempts *(auth.controller.ts and backend/follow-the-money-api/scripts/test-verification-security.ts)*.
- **Session Auth:** Stateless Bearer JWTs signed with `JWT_SECRET` (7-day lifespan) stored in browser `localStorage`. Global Axios 401 interceptor clears token and routes to `/login`. No HTTP-only cookie storage; CSRF mitigated by Bearer header authorization *(auth.controller.ts, config.ts, and frontend/src/lib/api.ts)*.
- **Rate Limiting:** `express-rate-limit` protects logins (10/15m), code requests (5/15m), submissions (10/15m), and exports (5/15m) *(backend/follow-the-money-api/src/middleware/rateLimiter.ts)*.
- **Data Scoping:** Enforced at application layer via authenticated `userId` in route queries; database engine Row-Level Security (RLS) is not enabled *(backend/follow-the-money-api/src/middleware/auth.ts and schema.prisma)*.
- **Error Handling & CORS:** Centralized error handler returns generic `{ error: "Internal server error" }`. CORS restricts allowed origins while permitting requests without an origin header; production uses `trust proxy` *(backend/follow-the-money-api/src/app.ts)*.

---

## 5. Data Exports and User Controls
Self-serve data portability and account deletion controls:
- **Full JSON Export:** Complete archive of profile, accounts, expenses, subscriptions, notes, and transfers (`GET /users/me/export?format=json`) with `no-store, no-cache` headers *(backend/follow-the-money-api/src/controllers/userController.ts and frontend/src/pages/Settings.tsx)*.
- **CSV Ledger Export:** Tabular chronological ledger export (`GET /users/me/export?format=csv`) *(userController.ts and Settings.tsx)*.
- **In-Browser PDF Export:** Filtered statement generation via jsPDF *(frontend/src/pages/Expenses.tsx)*.
- **Account Deletion:** `DELETE /users/me` triggers cascade deletion across active records (`Account`, `Expense`, `Subscription`, `Note`, `AccountAction`, `PendingEmailChange`). Unlinked `EmailVerificationCode` rows are not cascaded. As disclosed in `Privacy.tsx` and `Terms.tsx`, residual data may remain temporarily in managed cloud database backups, server logs, or email provider records until standard retention periods elapse *(userController.ts, schema.prisma, Privacy.tsx, and Terms.tsx)*.

---

## 6. AI / Claude Status: Prototype vs. Production
- **Current Production Status:** **Planned / prototype only; not active in production.** In the current live production deployment on Railway, MoneyTracker does not transmit user or financial data to Anthropic, because backend AI routes are unmounted in `app.ts` and no production `ANTHROPIC_API_KEY` is configured. Policy pages confirm AI analysis is inactive *(backend/follow-the-money-api/src/app.ts, frontend/src/pages/Privacy.tsx, and Security.tsx)*.
- **Architectural Prototype in Codebase:**
  - **Aggregate Minimization:** `aiSanitizer.service.ts` calculates 30-day category totals, top 5 percentage shares, active subscription counts, and base currency code. Descriptions, notes, account titles, counterparty names, and user profiles are omitted. Because category labels and currency code are strings, the payload is not strictly numeric and does not claim zero-PII status *(backend/follow-the-money-api/src/services/aiSanitizer.service.ts)*.
  - **Opt-In Controller:** `aiInsightsController.ts` requires opt-in (`optInConfirmed === true`) and rate limits requests (10/60m). In a configured test environment, it passes these aggregate metrics to Claude (`claude-3-5-sonnet-20241022`), returning HTTP 501 if unset *(aiInsightsController.ts)*.
  - **Settings UI:** `AiInsightsCard.tsx` provides an opt-in toggle in `localStorage`, a privacy explanation, and an inspection modal displaying the exact JSON payload before dispatch *(frontend/src/components/settings/AiInsightsCard.tsx)*.
- **Why Inactive in Production:** Routes in `aiInsightsRoutes.ts` are unmounted in `app.ts` (returning HTTP 404), and no Anthropic API key is configured on Railway *(app.ts and AiInsightsCard.tsx)*.
- **Prerequisites for Activation:** Mounting routes in `app.ts`, setting an `ANTHROPIC_API_KEY` on Railway, completing integration and rate-limit testing, updating public policies, and persisting consent in database tables rather than browser `localStorage`.

---

## 7. Limitations and Planned Improvements
- **Solo Maintenance & Unincorporated Status:** Maintained by one developer without an incorporated entity or team *(owner confirmed)*.
- **Founder-Only User Base:** No external users or commercial traction exist; testing is founder-driven *(owner confirmed)*.
- **Plaintext Storage at Rest:** Descriptions, notes, and balances lack field-level encryption (planned roadmap P2 milestone in `docs/improvement-roadmap.md`).
- **Client-Side Token Storage:** JWTs stored in `localStorage` rather than HTTP-only cookies with CSRF protection (future security enhancement in `docs/repository-audit.md`).
- **Application-Layer Isolation Only:** Tenant data scoping is handled through Prisma query filters; database engine Row-Level Security (RLS) is not enabled *(backend/follow-the-money-api/prisma/schema.prisma)*.
- **CORS Origin Fallback:** Requests missing an origin header are permitted (planned P2 update in `docs/improvement-roadmap.md`).
- **Manual Entry Model:** Eliminates aggregator scraping risks but requires disciplined manual entry *(frontend/src/pages/Landing.tsx and Terms.tsx)*.
