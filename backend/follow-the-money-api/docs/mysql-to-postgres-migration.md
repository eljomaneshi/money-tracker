# Complete Guide: Migrating from Railway MySQL to PostgreSQL (Supabase)

This document provides a comprehensive, step-by-step procedure for migrating the **Money Tracker** personal finance application from **Railway MySQL** to **PostgreSQL on Supabase**, as well as configuring and testing a local PostgreSQL environment using Docker.

---

## Table of Contents
1. [Overview & Architectural Changes](#1-overview--architectural-changes)
2. [Historical Railway MySQL Configuration (Reference)](#2-historical-railway-mysql-configuration-reference)
3. [Local Development: PostgreSQL with Docker](#3-local-development-postgresql-with-docker)
4. [Local Environment Variables Setup](#4-local-environment-variables-setup)
5. [Applying Prisma Migrations Locally](#5-applying-prisma-migrations-locally)
6. [Running & Testing the Backend Locally](#6-running--testing-the-backend-locally)
   - [Testing Authentication](#61-testing-authentication)
   - [Testing Accounts & Expenses](#62-testing-accounts--expenses)
   - [Testing Subscriptions & Cron Reminders](#63-testing-subscriptions--cron-reminders)
   - [Testing Dashboard Totals & Charts](#64-testing-dashboard-totals--charts)
   - [Testing CSV Export](#65-testing-csv-export)
7. [Running Schema & Database Validation Scripts](#7-running-schema--database-validation-scripts)
8. [Preparing Supabase (Production)](#8-preparing-supabase-production)
9. [Deploying Prisma Schema to Supabase](#9-deploying-prisma-schema-to-supabase)
10. [Exporting Railway MySQL Production Data](#10-exporting-railway-mysql-production-data)
11. [Migrating Production Data to Supabase](#11-migrating-production-data-to-supabase)
    - [Option A: Automated One-Off Script (Recommended)](#option-a-automated-one-off-script-recommended)
    - [Option B: Manual SQL Dump Import](#option-b-manual-sql-dump-import)
12. [Post-Migration Verification (Counts & Financial Totals)](#12-post-migration-verification-counts--financial-totals)
13. [Switching Railway Runtime Environment Variables](#13-switching-railway-runtime-environment-variables)
14. [Rollback Procedure (Railway MySQL Fallback)](#14-rollback-procedure-railway-mysql-fallback)

---

## 1. Overview & Architectural Changes

| Component | Railway MySQL (Previous) | PostgreSQL on Supabase (New) |
| :--- | :--- | :--- |
| **Prisma Provider** | `provider = "mysql"` | `provider = "postgresql"` |
| **Connection URLs** | Single `DATABASE_URL` | `DATABASE_URL` (PgBouncer/Pooler port `6543`) + `DIRECT_URL` (Direct session port `5432`) |
| **Enums** | Inline MySQL `ENUM(...)` | PostgreSQL `CREATE TYPE ... AS ENUM` |
| **Auto Increment** | `AUTO_INCREMENT` | `SERIAL` / Sequences (`setval`) |
| **Money / Balances** | `Float` (`DOUBLE` in SQL) | `Float` (`DOUBLE PRECISION` in SQL) |
| **Timestamps** | `DATETIME(3)` | `TIMESTAMP(3)` |
| **Migration Backup** | — | Preserved at `prisma/migrations_mysql_backup/` |

---

## 2. Historical Railway MySQL Configuration (Reference)

For reference, the original MySQL `.env` structure was:
```env
# Previous MySQL Railway Configuration
DATABASE_URL="mysql://root:[PASSWORD]@[RAILWAY_HOST]:[PORT]/railway"
PORT=4000
NODE_ENV=production
JWT_SECRET=[SECRET]
FRONTEND_URL=https://moneytracker.online
RESEND_API_KEY=re_[KEY]
EMAIL_FROM=noreply@moneytracker.online
```
> [!NOTE]
> Do **NOT** delete or alter the Railway MySQL database until PostgreSQL has been fully tested in production and verified.

---

## 3. Local Development: PostgreSQL with Docker

A dedicated `docker-compose.postgres.yml` file is provided in both the project root and `backend/follow-the-money-api/`. It uses port `5432` and a dedicated volume `money_tracker_postgres_data` (completely independent from any existing MySQL containers).

### Start PostgreSQL:
From the project root:
```powershell
docker compose -f docker-compose.postgres.yml up -d
```
Or from `backend/follow-the-money-api/`:
```powershell
docker compose -f docker-compose.postgres.yml up -d
```

### Check Container Status:
```powershell
docker ps --filter "name=money_tracker_postgres"
```

### Stop PostgreSQL:
```powershell
docker compose -f docker-compose.postgres.yml down
```

---

## 4. Local Environment Variables Setup

In `backend/follow-the-money-api/.env`, configure the PostgreSQL connection URLs:

```env
# Server
PORT=4000
NODE_ENV=development

# Database (Local Docker PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/money_tracker?schema=public
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/money_tracker?schema=public

# Auth
JWT_SECRET=local_development_super_secret_jwt_key_12345

# Email (Resend)
RESEND_API_KEY=re_dummy_key_for_local_testing
EMAIL_FROM=test@example.com

# Frontend
FRONTEND_URL=http://localhost:5173
```

---

## 5. Applying Prisma Migrations Locally

Once local PostgreSQL is running:

1. Navigate to the backend directory:
   ```powershell
   cd "backend\follow-the-money-api"
   ```

2. Apply the clean PostgreSQL migration history:
   ```powershell
   npx prisma migrate deploy
   ```
   *(Or run `npx prisma migrate dev` if modifying the schema).*

3. Generate the updated Prisma Client:
   ```powershell
   npm run prisma:generate
   ```

---

## 6. Running & Testing the Backend Locally

Start the backend in development mode with live reload:
```powershell
cd "backend\follow-the-money-api"
npm run dev
```
The server will start on port `4000` (or `PORT` specified in `.env`).

### 6.1 Testing Authentication
- **Health Check:**
  ```powershell
  curl http://localhost:4000/health
  # Expected: {"status":"ok","message":"Express + Prisma + PostgreSQL ready"}
  ```
- **Request Registration Code:**
  ```powershell
  curl -X POST http://localhost:4000/auth/register/request-code `
    -H "Content-Type: application/json" `
    -d '{"email":"testuser@example.com"}'
  ```
- **Login:**
  ```powershell
  curl -X POST http://localhost:4000/auth/login `
    -H "Content-Type: application/json" `
    -d '{"email":"testuser@example.com","password":"YourPassword123!"}'
  ```

### 6.2 Testing Accounts & Expenses
Using the JWT token returned from login (`Authorization: Bearer <TOKEN>`):
- **Create Account:**
  ```powershell
  curl -X POST http://localhost:4000/accounts `
    -H "Authorization: Bearer <TOKEN>" `
    -H "Content-Type: application/json" `
    -d '{"name":"Main Checking","type":"BANK","balance":1500.50,"baseCurrency":"EUR"}'
  ```
- **Create Expense:**
  ```powershell
  curl -X POST http://localhost:4000/expenses `
    -H "Authorization: Bearer <TOKEN>" `
    -H "Content-Type: application/json" `
    -d '{"accountId":1,"amount":35.20,"category":"Food","date":"2026-10-03T12:00:00Z","description":"Lunch"}'
  ```

### 6.3 Testing Subscriptions & Cron Reminders
- **Create Subscription:**
  ```powershell
  curl -X POST http://localhost:4000/subscriptions `
    -H "Authorization: Bearer <TOKEN>" `
    -H "Content-Type: application/json" `
    -d '{"name":"Streaming Service","price":12.99,"billingPeriod":"MONTHLY","nextBillingDate":"2026-10-15T00:00:00Z","accountId":1}'
  ```
- **Trigger Billing / Reminders:**
  Subscriptions are processed automatically at `03:00 AM` every morning via `node-cron`, or can be manually triggered via `POST /subscriptions/process-due`.

### 6.4 Testing Dashboard Totals & Charts
- Call `GET /accounts` and `GET /expenses` from the frontend to verify balances and totals match without precision rounding errors.

### 6.5 Testing CSV Export
- If exporting data from the client, verify timestamps are formatted as ISO 8601 strings and floating-point balances retain two decimal places.

---

## 7. Running Schema & Database Validation Scripts

We created two automated scripts in `scripts/`:

### A. Local Schema & CRUD Validation
Tests PostgreSQL connectivity, all 8 models, enums, relationships, and transactional rollback:
```powershell
npm run db:validate
```

### B. Count & Financial Totals Comparison
Compares MySQL against PostgreSQL:
```powershell
$env:RAILWAY_MYSQL_URL="mysql://..."
$env:DATABASE_URL="postgresql://..."
npm run db:compare
```

---

## 8. Preparing Supabase (Production)

1. Log in to [Supabase](https://supabase.com) and navigate to your project.
2. Go to **Project Settings** -> **Database**.
3. Under **Connection string**:
   - Select **URI**.
   - Note the **Transaction Pooler** URL (Port `6543` with `?pgbouncer=true`): This will be your `DATABASE_URL`.
   - Note the **Direct (Session)** URL (Port `5432`): This will be your `DIRECT_URL`.

Example format:
```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

---

## 9. Deploying Prisma Schema to Supabase

Before migrating production data, deploy the schema and tables to Supabase:

```powershell
cd "backend\follow-the-money-api"
$env:DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
$env:DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
npx prisma migrate deploy
```
Prisma will connect using `DIRECT_URL` and execute `0_init_postgresql`, creating all enums, tables, foreign keys, and indexes.

---

## 10. Exporting Railway MySQL Production Data

To take a complete backup of the Railway production MySQL database:

1. Obtain your Railway MySQL connection parameters (`HOST`, `PORT`, `USER`, `PASSWORD`, `DATABASE`).
2. Run `mysqldump` to create a data-only backup:
   ```powershell
   mysqldump -h [HOST] -P [PORT] -u [USER] -p[PASSWORD] `
     --no-create-info `
     --complete-insert `
     --skip-extended-insert `
     --default-character-set=utf8mb4 `
     [DATABASE] > railway_mysql_data_export.sql
   ```
   *(Keep this SQL backup file in a secure location as an emergency snapshot).*

---

## 11. Migrating Production Data to Supabase

### Option A: Automated One-Off Script (Recommended)

We created a custom, production-grade migration script: `scripts/migrate-mysql-to-postgres.ts`.

#### Features:
- **Zero source mutation:** Reads from Railway MySQL with read-only `SELECT` queries.
- **Foreign-key order:** Migrates `User` ➔ `Account` ➔ `Expense` ➔ `Subscription` ➔ `Note` ➔ `AccountAction` ➔ `EmailVerificationCode` ➔ `PendingEmailChange`.
- **Identity sequences:** Resets PostgreSQL `SERIAL` sequences to `MAX(id)` for every table so new records continue seamlessly.
- **Decimal-safe sums:** Tracks balances and amounts using exact `BigInt` cents math (no floating point errors).
- **Safety guards:** Requires `--confirm-production` when connecting to remote databases.

#### Step 1: Dry-Run Simulation (No Writes)
```powershell
cd "backend\follow-the-money-api"

$env:RAILWAY_MYSQL_URL="mysql://root:[PASSWORD]@[RAILWAY_HOST]:[PORT]/railway"
$env:SUPABASE_DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

npm run db:migrate-data -- --dry-run
```
*Review the output and ensure all records and sums are accurately identified.*

#### Step 2: Live Migration Execution
```powershell
npm run db:migrate-data -- --confirm-production
```
The script will insert all records in transaction batches, reset sequences, and verify row counts and financial totals.

---

## 12. Post-Migration Verification (Counts & Financial Totals)

Run the comparison script to guarantee zero discrepancy between Railway MySQL and Supabase:

```powershell
cd "backend\follow-the-money-api"

$env:RAILWAY_MYSQL_URL="mysql://root:[PASSWORD]@[RAILWAY_HOST]:[PORT]/railway"
$env:DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

npm run db:compare
```
*Output will display a table comparing all row counts and financial sums. It will return exit code `0` if all values match.*

---

## 13. Switching Railway Runtime Environment Variables

Once verification passes:
1. Open the **Railway Dashboard** for your backend service (`follow-the-money-api`).
2. Go to **Variables**.
3. Update `DATABASE_URL` to the Supabase Transaction Pooler URL (port `6543`):
   ```env
   DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
4. Add `DIRECT_URL` (port `5432`):
   ```env
   DIRECT_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   ```
5. Trigger a deployment on Railway.
6. Verify live health check: `https://[YOUR_RAILWAY_DOMAIN]/health`.

---

## 14. Rollback Procedure (Railway MySQL Fallback)

If unexpected issues arise after deploying to Supabase, rolling back takes less than 2 minutes:

1. **Do not panic:** The Railway MySQL database was never modified, deleted, or cleared.
2. In Railway Dashboard ➔ **Variables**:
   - Revert `DATABASE_URL` back to the original Railway MySQL URL:
     ```env
     DATABASE_URL=mysql://root:[PASSWORD]@[RAILWAY_HOST]:[PORT]/railway
     ```
   - Remove `DIRECT_URL`.
3. In local Git / codebase:
   - Restore `prisma/schema.prisma` datasource provider to `"mysql"`.
   - Restore migrations folder from `prisma/migrations_mysql_backup`.
   - Run `npx prisma generate` and redeploy backend.
4. The backend will instantly resume using Railway MySQL without data loss.
