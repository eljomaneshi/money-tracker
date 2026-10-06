# Migration Status & Resume Guide (Saved)

**Date:** October 4, 2026  
**Target:** Railway MySQL ➡️ Supabase PostgreSQL  

---

## Current Status: Production Migration to Supabase COMPLETE & VERIFIED (100% MATCH)

- **Supabase Project:** `oxoqhugvcgcacozsmxbq` (Region: `eu-west-1`)
- **Schema Deployed:** `0_init_postgresql` deployed and verified on Supabase.
- **Data Migrated & Verified:**
  - Users: 3 / 3
  - Accounts: 28 / 28
  - Expenses: 580 / 580
  - Subscriptions: 11 / 11
  - Notes: 4 / 4
  - Account Actions: 186 / 186
  - Email Verification Codes: 12 / 12
- **Financial Checksums (100% exact match down to the cent):**
  - Account Balances: €280,901.48
  - Expenses Total: €759,306.34
  - Subscriptions Total: €811.97
  - Account Actions Total: €2,022,356.18
- **PostgreSQL Sequences:** All `SERIAL` sequences set to `MAX(id)`.

---

## Quick Resume Commands for Tomorrow

### 1. Ensure Docker PostgreSQL is running
```powershell
docker compose -f docker-compose.postgres.yml up -d
```

### 2. Start the Backend API
```powershell
cd "backend\follow-the-money-api"
npm run dev
```

### 3. Quick Database Health Check
```powershell
cd "backend\follow-the-money-api"
npm run db:validate
```

---

## Available Migration Scripts
- `npm run db:validate` — Tests PostgreSQL connection, all 8 models, and transactional CRUD.
- `npm run db:compare` — Compares table counts & financial totals between MySQL and PostgreSQL.
- `npm run db:migrate-data -- --dry-run` — Simulates production data transfer with zero writes.
- `npm run db:migrate-data -- --confirm-production` — Transfers production data to Supabase and resets `SERIAL` sequences.

Full 15-step reference manual: `docs/mysql-to-postgres-migration.md`.
