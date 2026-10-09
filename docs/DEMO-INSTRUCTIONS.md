# MoneyTracker — Demo Environment & Synthetic Data Runbook

This runbook documents the requirements and procedures for preparing an isolated demonstration environment using synthetic financial data for video walkthroughs or evaluations.

---

## 1. Absolute Production Prohibition

> **CRITICAL WARNING — DO NOT USE PRODUCTION:**  
> Never use the live production deployment (`https://moneytracker.online`), the production Supabase database, or real personal financial data for demonstration recordings. Seeding fictitious entries into production risks permanent data corruption, and recording real accounts risks exposing personal balances, account titles, counterparty names, or private email content. All demo activities must run in an isolated environment.

---

## 2. Seed Process Assessment & Current Blocker

- **No Existing Seed Script:** Repository inspection confirms that no automated seed script, fixture set, or pre-configured demo account exists. `backend/follow-the-money-api/package.json` contains no seed scripts, and `backend/follow-the-money-api/prisma/` contains no `seed.ts` file.
- **Authentication Constraint:** User registration requires a two-step email verification flow (`requestRegisterCode`). Verification codes are cryptographically hashed using SHA-256 (`codeHash`) before database insertion; raw codes are never stored as plaintext.
- **Current Setup Blocker:** Because no automated seed script or local email-capture workflow currently exists in the repository, **there is not yet a safe one-command local demo-account setup**. Manual offline registration is blocked because the backend attempts external delivery via Resend, and codes cannot be retrieved by inspecting database tables. Manual demo setup remains blocked until a safe local provisioning method is implemented.

---

## 3. What Must Be Implemented Before Recording

Before recording can take place, the repository requires:
1. **A Safe Local-Only Seed Workflow:** A dedicated developer script (such as `prisma/seed.ts`) that programmatically creates a pre-verified local user account with a hashed password, bypassing email dispatch.
2. **Pre-Seeded Synthetic Records:** Programmatic insertion of sample accounts, expenses, subscriptions, and notes directly into the local PostgreSQL database, eliminating manual UI entry.
3. **Zero Third-Party Secrets:** The local demo setup must operate fully offline without requiring a Resend API key, external SMTP credentials, or production environment variables.

---

## 4. Verified Local Infrastructure Setup

When a local seed mechanism is ready, the following verified repository commands provision the isolated local stack:

### Step 1: Launch Local PostgreSQL Container
From the repository root, start the PostgreSQL 16 container in `docker-compose.postgres.yml`:
```bash
docker compose -f docker-compose.postgres.yml up -d
```
Confirm the container is running:
```bash
docker ps --filter "name=money_tracker_postgres"
```

### Step 2: Configure Local Environment Files
Copy the example files without adding production keys:
- **Backend:** Copy `backend/follow-the-money-api/.env.example` to `backend/follow-the-money-api/.env`. Set `DATABASE_URL` to the local container:
  ```env
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/money_tracker?schema=public"
  JWT_SECRET="local-development-demo-jwt-secret-key-32-chars-min"
  PORT=4000
  ```
- **Frontend:** Copy `frontend/.env.example` to `frontend/.env`:
  ```env
  VITE_API_URL="http://localhost:4000"
  ```

### Step 3: Apply Migrations
From `backend/follow-the-money-api`:
```bash
npx prisma generate
npx prisma migrate deploy
```

### Step 4: Start Application Services
- **Backend:** In `backend/follow-the-money-api`, run `npm run dev` (API on `http://localhost:4000`).
- **Frontend:** In `frontend`, run `npm run dev` (client on `http://localhost:5173`).

---

## 5. Illustrative Synthetic Data Examples

The following records are non-existent illustrative examples for multi-currency flows. *They do not exist in the repository.*

- **Synthetic Accounts (`/balance`):**
  - Checking: `Main Checking` | `BANK` | `EUR` | `€2,450.00`
  - Cash Wallet: `Cash Wallet` | `CASH` | `ALL` | `45,000 ALL`
  - Savings: `Freelance Savings` | `BANK` | `USD` | `$1,200.00`
  - Reserve: `Travel Cash` | `CASH` | `GBP` | `£350.00`
- **Synthetic Transactions (`/activity`):**
  - Outflow: `€45.00` | Category: `Food` | Account: `Main Checking` | Description: `Weekly Groceries`
  - Outflow: `3,200 ALL` | Category: `Transport` | Account: `Cash Wallet` | Description: `Transit Pass`
  - Inflow: `€1,500.00` | Account: `Main Checking` | Description: `Consulting Retainer`
  - Transfer: `€200.00` from `Main Checking` to `Cash Wallet` via Quick Actions.
- **Synthetic Subscriptions (`/subscriptions`):**
  - `Cloud Storage Suite`: `€9.99` / month | Renewal: 5 days | Linked: `Main Checking`
  - `Developer Tooling`: `$120.00` / year | Renewal: Next month | Linked: `Freelance Savings`
- **Synthetic Notes (`/notes`):**
  - Task: `Audit annual subscriptions` | Status: `OPEN`
  - Receivable: `Design invoice` | Amount: `€400.00` | Counterparty: `Acme Studio` | Status: `OPEN`

---

## 6. Verification and Export Inspection

Verify screens only after synthetic data is loaded:
1. **Dashboard & Balances:** Verify primary and secondary currency totals and Quick Action modal calculations.
2. **Activity Ledger:** Test 25-item pagination, filtering, and click **Export PDF** to confirm in-browser jsPDF generation contains only synthetic entries.
3. **Settings Exports:** Download **JSON Archive** and **CSV Ledger**; inspect files in a text editor to confirm no real personal data exists. Confirm the AI Insights card displays the inactive notice.

---

## 7. Safe Teardown & Local Volume Warning

- **In-App Account Deletion:** To clear demo data cleanly, navigate to `/settings` and use **Delete Account** in the Danger Zone. This triggers a cascading deletion across active user records.
- **Irreversible Volume Teardown Warning:**  
  Running:
  ```bash
  docker compose -f docker-compose.postgres.yml down -v
  ```
  **permanently deletes all data** in the named volume `money_tracker_postgres_data`. This command must only be run when the developer explicitly intends to destroy the local database and has confirmed no local development data needs to be retained.

---

## 8. Screen Recording Precautions

- **Clean Browser Profile:** Record in a dedicated browser profile with bookmarks, extensions, and history hidden.
- **Disable Autofill:** Turn off browser password autofill to prevent popups during login.
- **Hide Sensitive Windows:** Keep terminals, `.env` files, cloud dashboards, and personal inboxes off-screen.
- **Silence Notifications:** Turn off operating system and messaging alerts before recording.
