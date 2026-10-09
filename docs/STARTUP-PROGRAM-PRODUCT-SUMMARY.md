# MoneyTracker — Startup Program Product Summary

## 1. Product Name and Pitch
**Product Name:** MoneyTracker  
**One-Sentence Pitch:** A privacy-first personal finance workspace for tracking multi-currency cashflow, recurring subscriptions, and notes without bank credentials or third-party data scraping *(verified in README.md, frontend/src/pages/Landing.tsx, and Terms.tsx)*.

---

## 2. Problem
Managing multi-currency personal finances (EUR, USD, ALL, GBP) creates fragmented workflows. Traditional finance apps routinely demand online banking credentials or harvest transaction data for advertising. Users seeking privacy-preserving tracking without aggregator vulnerabilities are forced into spreadsheets that lack recurring reminders and unified balances *(verified in README.md, frontend/src/pages/Landing.tsx, and Privacy.tsx)*.

---

## 3. Solution
MoneyTracker provides a unified workspace where users retain record ownership without connecting external bank accounts:
- **Multi-Currency Cashflow:** Tracks expenses, deposits, withdrawals, and transfers with automatic balance math (EUR, ALL, USD, GBP).
- **Activity Ledger & Export:** Filterable ledger with 25-item pagination, cashflow summaries, and browser PDF statement export.
- **Recurring Subscriptions:** Tracks renewals with background email reminders.
- **Notes & Portability:** Workspace for financial tasks, self-serve JSON/CSV export, and active-record account deletion.

MoneyTracker is an organizational record-keeping tool and does not provide financial, investment, credit, or tax advice *(verified in frontend/src/pages/Balance.tsx, Expenses.tsx, Subscriptions.tsx, Notes.tsx, Settings.tsx, and Terms.tsx)*.

---

## 4. Target Users
- Expats, remote workers, and freelancers managing balances across domestic and international currencies.
- Privacy-conscious individuals refusing to share bank credentials and seeking tracker-free software *(verified in frontend/src/pages/Landing.tsx and Privacy.tsx)*.

---

## 5. Current Product Status and Verified Capabilities
**Product Status:** A working, usable full-stack web app deployed at `https://moneytracker.online`, built with React 19, an Express API on Railway, and PostgreSQL on Supabase (EU West) *(verified in README.md and docs/ANTIGRAVITY-CONTINUATION.md)*.

**Verified Capabilities Available Today:**
- Custom JWT auth with bcrypt hashing and CSPRNG verification codes via Resend.
- Multi-currency balances and inter-account transfers (EUR, ALL, USD, GBP).
- Activity ledger with 25-item pagination and client-side PDF statement export.
- Recurring subscription renewal monitoring via `node-cron`.
- Notes, self-serve JSON/CSV export, and active-record account deletion.
- Public trust, terms, and privacy pages (`founder@moneytracker.online`).

*(Verified in backend controllers/cron, frontend/src/pages/Landing.tsx, and Privacy.tsx.)*

---

## 6. Traction and Validation
- **User Traction:** The founder is currently the only user. External adoption, beta cohorts, customer validation, and revenue have not yet been established *(owner confirmed)*.
- **Technical Validation:** Verified working end-to-end, with a completed PostgreSQL migration, production Railway deployment, and full frontend overhaul on `main` *(verified in docs/MIGRATION_STATUS.md and docs/ANTIGRAVITY-CONTINUATION.md)*.

---

## 7. Why Now
- **Financial Privacy Demand:** Pushback against bank aggregator data harvesting drives demand for sovereign financial tools *(verified in frontend/src/pages/Landing.tsx and Security.tsx)*.
- **Full-Stack Efficiency:** Modern tooling (React 19, Tailwind CSS 4, PostgreSQL, AI APIs) allows solo founders to deploy resilient FinTech software without large teams *(verified in README.md)*.

---

## 8. Claude / AI Fit and Intended Use
- **Production Status:** **Planned / prototype only; not active in production.** In live production on Railway, MoneyTracker does not transmit user or financial data to Anthropic: AI routes are unmounted in `app.ts` and no production `ANTHROPIC_API_KEY` is configured. Policy pages confirm AI analysis is inactive *(verified in backend/follow-the-money-api/src/app.ts and frontend/src/pages/Privacy.tsx)*.
- **Architectural Prototype:** `aiSanitizer.service.ts` implements aggregate-metrics minimization: 30-day category totals, percentage shares, active subscription counts, and base currency code, omitting transaction descriptions, notes, and counterparty names. `AiInsightsCard.tsx` provides an opt-in switch and preview modal *(verified in backend/follow-the-money-api/src/services/aiSanitizer.service.ts and frontend/src/components/settings/AiInsightsCard.tsx)*.
- **Intended Claude Use:** If enabled in a future release, MoneyTracker is planned to call Claude (via first-party API) to generate monthly constructive spending observations over user-inspected aggregate metrics. The prototype is designed to omit raw transaction logs and personal free-text descriptions from model context; this behavior is not active in production and requires route mounting, key provisioning, security testing, and policy updates before release *(verified in backend/follow-the-money-api/src/controllers/aiInsightsController.ts)*.

---

## 9. Founder and Company Status
- **Founder & Entity:** Unincorporated individual founder project developed by solo creator Eljo Maneshi; not currently a registered company *(verified in LICENSE and owner confirmed)*.
- **Business Contact:** Dedicated business email established at `founder@moneytracker.online` *(verified in frontend/src/pages/Privacy.tsx and Terms.tsx)*.
- **Application Context:** This preparation represents the founder's first-time application to Claude for Startups for MoneyTracker *(owner confirmed)*.

---

## 10. Verification Notes / Remaining Confirmations
1. **Public Registration Policy:** Whether registrations on `https://moneytracker.online` should remain open or switch to invite-only while the founder is the sole user.
2. **Claude Console Account:** Whether an active Claude Console developer organization exists under `founder@moneytracker.online`.
