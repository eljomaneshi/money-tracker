# Antigravity Continuation Note

## 1. Project Architecture
- **Frontend:** React 19 Single Page Application built with Vite, TypeScript, Tailwind CSS 4, React Router DOM (v7), Context API (`AuthContext`), and an Axios HTTP client.
- **Backend:** Node.js, Express.js (v5), and TypeScript, using Prisma ORM for database access, `node-cron` for scheduled subscription billing/reminders, and Resend for transactional email delivery.

---

## 2. Active Environment File Paths
- **Backend Active Configuration:** `backend/follow-the-money-api/.env`
  - Variables read: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `FRONTEND_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `PORT`, `NODE_ENV`.
- **Frontend Active Configuration:** `frontend/.env`
  - Variables read: `VITE_API_URL`.
- **Templates (Safe / Whitelisted in Git):**
  - Root: `.env.example`
  - Backend: `backend/follow-the-money-api/.env.example`
  - Frontend: `frontend/.env.example`

---

## 3. Database & Hosting Setup
- **Local Development:** PostgreSQL 16 running via Docker (`docker-compose.postgres.yml` on port `5432`, database `money_tracker`).
- **Production Database:** Supabase PostgreSQL (`aws-0-eu-west-1.pooler.supabase.com`):
  - Pooled connection (`port 6543`, `?pgbouncer=true`) for runtime queries (`DATABASE_URL`).
  - Direct connection (`port 5432`) for Prisma migrations (`DIRECT_URL`).
- **Production Application Hosting:** Railway hosts the Express API service (`follow-the-money-api`), pointing its environment variables to the Supabase PostgreSQL database.

---

## 4. Status of prisma+postgres
- **Confirmed Obsolete:** `prisma+postgres://` was never used in application code, Prisma Accelerate is not installed, and the protocol was never part of production.
- **Removed:** The unused outer `backend/.env` file that contained the reference has been deleted.
- **Orphaned Directory:** `backend/prisma/` remains as an unused skeleton directory and can be safely deleted.

---

## 5. Git History & Secrets Status
- **Confirmed Clean:** A comprehensive search across all commits and branches confirmed that **no real secrets, passwords, or API keys** were ever committed to Git history.
- All historical occurrences of credential variable names in tracked files were either code references (`process.env.*`) or template placeholders.

---

## 6. Current Git & .gitignore Status
- **Ignored:** All `.env*` files are strictly ignored across the entire repository tree. `git check-ignore` confirms local `.env` files are not tracked.
- **Tracked:** Zero `.env` files exist in the Git index (only `.env.example` templates are tracked).
- **Working Tree:**
  - Modified (unstaged): `.gitignore`, `backend/follow-the-money-api/.gitignore`, `frontend/.gitignore`.
  - Untracked: `.env.example`, `frontend/.env.example`, `docs/repository-audit.md`, `docs/improvement-roadmap.md`, `docs/baseline-check.md`, `docs/ANTIGRAVITY-CONTINUATION.md`.

---

## 7. Remaining Tasks in Priority Order
1. **Remove Orphaned Directory:** Delete the unused skeleton directory `backend/prisma/`.
2. **Local Database Startup:** Launch Docker Desktop and run `docker compose -f docker-compose.postgres.yml up -d` to verify local DB connectivity.
3. **Fix E2E Test Exit Masking:** In `backend/follow-the-money-api/scripts/test-e2e-api.ts`, remove the unconditional `process.exit(0)` inside the `finally` block so database failures emit a non-zero exit code.
4. **CSPRNG Verification Codes:** In `backend/follow-the-money-api/src/controllers/auth.controller.ts`, replace `Math.random()` with `crypto.randomInt(100000, 1000000)`.
5. **Add Authentication Rate Limiting:** Introduce rate limiting on `/auth` verification and login endpoints to prevent brute-force attacks.
6. **Documentation Alignment:** Update `README.md` to reflect the active PostgreSQL architecture instead of MySQL.
7. **Frontend Linting Resolution:** Fix the 41 ESLint warnings/errors (notably `react-hooks/set-state-in-effect` in `Subscriptions.tsx` and explicit `any` usages).

---

## 8. Important Safety Rules
- **Never print, copy, or log secret values, connection strings, or API keys.**
- **Never modify application code without explicit instructions.**
- **Never stage or commit `.env` files.**
- **Do not perform destructive operations on the production Supabase database.**
- **Ensure Git index cache remains clear of sensitive files.**

---

## 9. Next Read-Only Verification Prompt
Copy and paste this prompt to verify the baseline in the next session:

```text
Perform a read-only verification of the MoneyTracker repository state.

Do not modify, create, delete, install, commit, or push anything.
Do not display any secret values.

Check:
1. Current git status (cleanliness of working tree, unstaged changes, untracked files).
2. Confirm whether backend/follow-the-money-api/.env and frontend/.env exist and are ignored by Git.
3. Confirm whether backend/.env is absent.
4. Confirm whether backend/prisma/ still exists.
5. Confirm that no .env files are tracked in the Git index.
6. Verify whether Docker and local PostgreSQL on port 5432 are running and reachable.

Report findings with exact file paths and statuses. Never print environment file contents.
```
