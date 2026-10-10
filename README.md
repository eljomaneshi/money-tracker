# Money Tracker

A full-stack personal finance tracker built with React, Vite, Express.js, Prisma, PostgreSQL (Supabase / Docker), and Railway.

## Overview

Money Tracker is an ongoing full-stack web application for managing personal finances in one place. It allows users to track accounts and resources, record expenses, manage recurring subscriptions, and monitor total balances across their financial data.

The project combines a React + Vite frontend with an Express.js backend, Prisma ORM, and PostgreSQL database. In production, the backend is hosted on Railway and connects to a managed PostgreSQL database on Supabase; in local development, it runs against a local PostgreSQL container orchestrated via Docker Compose.

## Features

- Secure user authentication with cryptographically secure email verification codes.
- Account and resource management for tracking where money is stored.
- Expense tracking with balance updates tied to accounts.
- Subscription tracking for recurring payments.
- Dashboard totals across financial resources with first-time onboarding guidance.
- Currency-aware finance flows, including ALL and EUR handling.
- Support for account balance logic and transfer-related finance flows.
- Backend API built with Express, TypeScript, and Prisma ORM.
- Production-ready deployment architecture using Railway (API) and Supabase (PostgreSQL).

## Tech Stack

| Layer | Technologies |
|------|------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS 4 |
| Backend | Node.js, Express.js (v5), TypeScript |
| Database | PostgreSQL (Supabase in production, Docker in local dev) |
| ORM | Prisma |
| Deployment | Railway (API), Supabase (PostgreSQL) |

The stack was chosen to build a realistic full-stack finance application with a modern frontend, structured backend, relational database modeling, and straightforward deployment.

## Project Structure

```text
money-tracker/
├── backend/
│   └── follow-the-money-api/        # Express + Prisma API
│       ├── prisma/
│       │   ├── migrations/          # Database migration history
│       │   └── schema.prisma        # Prisma schema (PostgreSQL datasource)
│       ├── src/
│       │   ├── controllers/         # Request handlers
│       │   ├── cron/                # Scheduled jobs / reminders
│       │   ├── lib/                 # Shared backend helpers
│       │   ├── middleware/          # Auth, rate limiting, and request middleware
│       │   ├── routes/              # API routes
│       │   ├── services/            # Business logic & email dispatch
│       │   ├── utils/               # Utility functions
│       │   ├── config.ts            # Environment/config loading
│       │   └── server.ts            # Backend entry point
│       ├── .env.example             # Example backend environment variables
│       ├── package.json
│       └── tsconfig.json
├── frontend/                        # React + Vite client
│   ├── public/
│   ├── src/
│   │   ├── components/              # Reusable UI components & onboarding
│   │   ├── contexts/                # React context providers (AuthContext)
│   │   ├── lib/                     # Frontend shared logic & API client
│   │   ├── pages/                   # Main app and trust pages
│   │   ├── utils/                   # Utility helpers
│   │   ├── App.tsx                  # Root app router & layout
│   │   └── main.tsx                 # Frontend entry point
│   ├── .env.example                 # Example frontend environment variables
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── docs/                            # Architecture, roadmap & migration manuals
│   ├── ANTIGRAVITY-CONTINUATION.md  # Session continuation & task roadmap
│   ├── improvement-roadmap.md       # Product & security improvement roadmap
│   ├── repository-audit.md          # Comprehensive codebase audit
│   ├── baseline-check.md            # Diagnostic check results
│   ├── MIGRATION_STATUS.md          # PostgreSQL migration verification log
│   └── mysql-to-postgres-migration.md # Historical migration runbook
├── screenshots/                     # Application screenshots
│   ├── register.png
│   ├── login.png
│   ├── dashboard-light.png
│   ├── dashboard-dark.png
│   ├── balances.png
│   ├── subscriptions.png
│   ├── activity.png
│   ├── notes.png
│   ├── settings-account.png
│   └── settings-preferences.png
├── docker-compose.postgres.yml      # Local PostgreSQL container definition
├── .env.example                     # Global environment variables template
├── README.md
└── LICENSE
```

## Setup

### Prerequisites

Make sure you have:

- **Node.js** (v18+ recommended) and **npm** installed.
- **Docker & Docker Compose** (for running local PostgreSQL) or a local/remote PostgreSQL 16+ instance.

### 1. Clone the repository

```bash
git clone https://github.com/eljomaneshi/money-tracker.git
cd money-tracker
```

### 2. Configure environment files

Copy the example environment files for both backend and frontend:

**Backend:**
```bash
cp backend/follow-the-money-api/.env.example backend/follow-the-money-api/.env
```
*(On Windows PowerShell: `Copy-Item "backend/follow-the-money-api/.env.example" "backend/follow-the-money-api/.env"`)*

**Frontend:**
```bash
cp frontend/.env.example frontend/.env
```
*(On Windows PowerShell: `Copy-Item "frontend/.env.example" "frontend/.env"`)*

### 3. Start local PostgreSQL

Start the PostgreSQL 16 container via Docker Compose from the project root:

```bash
docker compose -f docker-compose.postgres.yml up -d
```

Confirm the container is running:

```bash
docker ps --filter "name=money_tracker_postgres"
```

### 4. Install dependencies

**Backend:**
```bash
cd backend/follow-the-money-api
npm install
```

**Frontend:**
```bash
cd ../../frontend
npm install
```

### 5. Generate Prisma client & apply database migrations

From `backend/follow-the-money-api`:

```bash
cd ../backend/follow-the-money-api
npx prisma generate
npx prisma migrate deploy
```

*(Optional: Run `npm run db:validate` to test PostgreSQL connection, all 8 models, and transactional CRUD).*

### 6. Run the backend

From `backend/follow-the-money-api`:

```bash
npm run dev
```

The backend API will start on `http://localhost:4000`.

### 7. Run the frontend

In a separate terminal, start the Vite development server:

```bash
cd frontend
npm run dev
```

The frontend client will start on `http://localhost:5173` and connect to the backend at `http://localhost:4000`.

## Environment Variables

### Backend (`backend/follow-the-money-api/.env`)

The backend environment template is located at [backend/follow-the-money-api/.env.example](./backend/follow-the-money-api/.env.example):

```env
PORT=4000
NODE_ENV=development

# Database Connection (PostgreSQL)
# Local development default (Docker):
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/money_tracker?schema=public
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/money_tracker?schema=public

# Supabase Production Reference:
# DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
# DIRECT_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres

# Authentication
JWT_SECRET=replace_with_a_long_random_secret

# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
EMAIL_FROM=you@example.com

# Allowed Frontend Origin (CORS)
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

The frontend environment template is located at [frontend/.env.example](./frontend/.env.example):

```env
# Backend API Base URL
VITE_API_URL=http://localhost:4000
```

### Notes

- Never commit a real `.env` file to Git.
- Use `.env.example` templates only for documentation and safe placeholders.
- In production, secrets are configured securely in Railway Environment Variables.

## Database and Prisma

The backend uses Prisma ORM with PostgreSQL for schema management, migrations, and type-safe database queries.

In production on Supabase, the application leverages connection pooling:
- `DATABASE_URL`: Connects to PgBouncer connection pooler on port `6543` (`?pgbouncer=true`) for application query scaling.
- `DIRECT_URL`: Connects directly to PostgreSQL on session port `5432` for executing Prisma migrations.

Useful database commands (from `backend/follow-the-money-api`):

```bash
# Generate Prisma client
npx prisma generate

# Apply pending migrations (production deployment and local setup)
npx prisma migrate deploy

# Create and apply migrations during schema changes in development
npx prisma migrate dev

# Validate PostgreSQL connection, all 8 models, and transactional CRUD
npm run db:validate
```

## Deployment

The production architecture is decoupled across two services:
- **Backend API:** Hosted on Railway (`follow-the-money-api`).
- **Production Database:** Managed PostgreSQL on Supabase (EU West region).

### Backend Deployment (Railway)

Railway runs the Express API with `npm start` (`prisma migrate deploy && node dist/server.js`), automatically executing pending database migrations before launching the web server.

Required Railway Environment Variables:
- `DATABASE_URL` — Supabase pooled connection string (`port 6543`, `?pgbouncer=true`).
- `DIRECT_URL` — Supabase direct connection string (`port 5432`) used by Prisma migrations.
- `JWT_SECRET` — Long random secret for signing authentication tokens.
- `RESEND_API_KEY` — API key for transactional emails.
- `EMAIL_FROM` — Verified sender address (e.g. `noreply@moneytracker.online`).
- `FRONTEND_URL` — Allowed origin URL for CORS (e.g. `https://moneytracker.online`).
- `PORT` — Port assigned dynamically by Railway (or fallback `4000`).
- `NODE_ENV` — `production`.

### Important Deployment Notes

- Real `.env` files are used exclusively for local development and are excluded from Git.
- Railway Pre-deploy Command must remain empty (Prisma migrations are deployed automatically as part of `npm start`).
- Railway Custom Start Command must remain `npm start`.

### Suggested Deployment Flow

1. Push your verified changes to GitHub (`main` branch).
2. Ensure the Railway service is connected to the repository and branch.
3. Confirm all required production variables (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, etc.) are configured in Railway Variables.
4. Railway automatically builds and restarts the container upon receiving new commits.

## Security Notes

- Real `.env` files should stay local only and never be checked into version control.
- Passwords are encrypted with bcrypt; verification codes are generated using cryptographically secure random integers (`crypto.randomInt`) and stored as SHA-256 hashes.
- Route-level rate limiting is enforced on sensitive authentication endpoints.
- Production secrets live in Railway Variables, not in source control.

## Roadmap

Planned or possible future improvements include:

- Safe personal data export (JSON / CSV).
- Dedicated `/health` endpoint verifying live database connectivity.
- Privacy-preserving, opt-in Claude/AI insights using minimized aggregate data.
- More dashboard polish, reporting, and balance insights.
- Continued refinement of currency handling and account transfer flows.

## License

This project is licensed under the MIT License.

See the [LICENSE](./LICENSE) file for the full text.
