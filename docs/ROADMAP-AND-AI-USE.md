# MoneyTracker — 3–6 Month Roadmap & Claude / AI Use Plan

## 1. Current Status and Constraints
MoneyTracker is an unincorporated personal finance app developed by a solo founder, not a registered company *(owner confirmed; verified in LICENSE and README.md)*. Deployed at `https://moneytracker.online`, the backend runs on Railway (Express v5) with PostgreSQL on Supabase (EU West) *(README.md and docs/ANTIGRAVITY-CONTINUATION.md)*.

The founder is currently the sole user; external adoption, beta cohorts, and revenue have not yet been established *(owner confirmed)*. This supports a first-time application to Claude for Startups.

**Claude / AI Status:** Prototype only; **not active in production**. Routes in `aiInsightsRoutes.ts` are unmounted in `app.ts`, and no `ANTHROPIC_API_KEY` is configured on Railway *(backend/follow-the-money-api/src/app.ts)*. Program access is conditional on review; Anthropic's official page ([https://claude.com/programs/startups](https://claude.com/programs/startups)) states credit tiers are over capacity and applications may be re-reviewed. Developing prototype features is independent of program approval and can proceed via self-funded API access.

---

## 2. Near-Term Product and Reliability Priorities
Roadmap items categorized by verified status:

### Already Implemented
- **Core Tracking:** Multi-currency balance management (EUR, ALL, USD, GBP), logging, and transfers *(frontend/src/pages/Balance.tsx and backend/follow-the-money-api/prisma/schema.prisma)*.
- **Ledger & Export:** Filterable ledger with 25-item pagination, cashflow metrics, and client-side PDF statement export *(frontend/src/pages/Expenses.tsx)*.
- **Subscriptions:** Renewal tracking with email reminders via `node-cron` and Resend *(backend/follow-the-money-api/src/cron/subscriptionCron.ts and emailService.ts)*.
- **Security & Portability:** bcrypt hashing, CSPRNG codes with lockout protection, rate limiting, JSON/CSV exports, and cascade deletion *(auth.controller.ts, rateLimiter.ts, and userController.ts)*.
- **Trust Center:** Transparent terms, privacy disclosures, and security documentation *(frontend/src/pages/Privacy.tsx, Terms.tsx, and Security.tsx)*.

### In Progress
- **Documentation:** Drafting verified startup program documents *(docs/STARTUP-PROGRAM-PRODUCT-SUMMARY.md, docs/TECH-AND-PRIVACY-POSITIONING.md)*.

### Proposed Milestones
- **Mobile Device Verification:** Physical testing of overhauled controls and modal portals *(docs/ANTIGRAVITY-CONTINUATION.md)*.
- **Field-Level Encryption (Roadmap P2):** Encrypt descriptions and notes at rest before external onboarding *(docs/improvement-roadmap.md)*.
- **Strict CORS Policy (Roadmap P2):** Restrict cross-origin requests to defined client origins *(docs/improvement-roadmap.md)*.
- **Cookie Sessions:** Evaluate migrating `localStorage` JWTs to HTTP-only cookies with CSRF protection *(docs/repository-audit.md)*.
- **Bundle Optimization (Roadmap P3):** Dynamic imports for heavy client libraries *(docs/improvement-roadmap.md)*.

---

## 3. User Discovery and Validation Plan
Validation will follow an ethical, consent-based progression:
1. **Founder Dogfooding (Initial):** Continued daily operational use by the founder to verify multi-currency workflows and reminders.
2. **Closed Alpha Cohort (Proposed):** Recruit 3–5 privacy-conscious remote workers or freelancers via personal networks under informed consent.
3. **Qualitative Feedback (Proposed):** Structured interviews on usability, privacy expectations, and friction. No background trackers or telemetry will be used.

---

## 4. Proposed Claude Use Case and Staged Rollout
### Use Case
Constructive monthly spending observations over high-level aggregates (category trends, subscription commitments). Strictly non-advisory informational summaries, not regulated financial or investment advice *(frontend/src/pages/Terms.tsx)*.

### Staged Rollout (Proposed)
- **Stage 1 (Local Testing):** Validate prompt reliability, token caps, and error handling in a local environment.
- **Stage 2 (Review Gate):** Complete engineering tests, security review, policy updates, and database consent persistence before staging.
- **Stage 3 (Closed Alpha):** Enable feature exclusively for opt-in alpha cohort participants.
- **Stage 4 (Production):** Mount routes with strict rate limiting (10 req/hour), caching, and a rollback circuit breaker.

---

## 5. Responsible Data Handling and User Controls
The prototype implements aggregate-metrics minimization:
- **Included Data:** 30-day category totals, top 5 category shares (percentages), active subscription count, subscription commitment total, and base currency code.
- **Excluded Data:** Descriptions, notes, merchants, account titles, counterparty names, and user profiles are omitted at query level.
- **User Controls in UI:** Opt-in toggle in `AiInsightsCard.tsx`, payload inspection modal showing exact JSON, and instant consent revocation.

### Mandatory Review Gate Before Activation
1. **Engineering Tests:** End-to-end testing of parsing, token limits, and error codes.
2. **Security Audit:** Verified rate limits, secured Railway variables, and timeout guards.
3. **Policy Updates:** Disclosing Anthropic as a sub-processor and data categories processed *(frontend/src/pages/Privacy.tsx and Security.tsx)*.
4. **Server-Side Consent:** Migrate opt-in state from `localStorage` to database records.
5. **Rollback Plan:** Administrative kill switch to disable AI endpoints immediately.

---

## 6. Proposed Use of API Credits
If granted, credits would offset testing costs across 3–6 months:
- **Prompt Testing (20%):** Tuning system prompts for concise observations (<= 400 tokens).
- **Resilience Testing (20%):** Validating behavior under low-data states (e.g., brand-new accounts).
- **Closed Alpha (40%):** Supporting periodic observations for 5–20 opt-in test users.
- **Model Evaluation (20%):** Benchmarking Claude 3.5 Sonnet against Claude Haiku for latency and unit economics.

*Note: Access to credits is conditional on Anthropic program review ([https://claude.com/programs/startups](https://claude.com/programs/startups)). MoneyTracker remains fully functional as a personal finance tracker regardless of credit allocation.*

---

## 7. Success Measures and Risks
### Success Measures
- **Data Minimization:** Zero inclusion of free-text descriptions or user identifiers in LLM prompts.
- **Reliability:** <1% API failure rate, with non-blocking user-facing error fallbacks.
- **Cost Efficiency:** Average prompt payload < 500 tokens, maintaining low ongoing unit economics.

### Risks and Mitigations
- **Unintended Advice:** Restrictive system prompts instructing Claude to avoid investment or legal recommendations.
- **API Downtime:** Non-blocking UI states and clear offline notices.
- **Program Overcapacity:** Core manual tracking operates completely independent of AI availability.

---

## 8. Verification Notes & Owner Decisions Needed
1. **Public Registration Policy:** Confirm whether registrations on `https://moneytracker.online` should remain open or temporarily switch to invite-only while the founder is the sole user.
2. **Alpha Tester Recruitment:** Confirm preferred outreach channels for recruiting the first 3–5 external alpha users.
3. **Developer Account Status:** Confirm whether an active Claude Console organization account has been established with `founder@moneytracker.online`.
