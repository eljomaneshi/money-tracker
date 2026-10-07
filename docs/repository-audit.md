# MoneyTracker Repository Audit

## A. Architecture Overview

### Frontend
- **Framework & Tooling:** React 19 Single Page Application (SPA) powered by Vite and TypeScript.
- **Styling:** Tailwind CSS 4 (`@tailwindcss/vite`).
- **Routing:** React Router DOM (v7) managing protected routes and application views.
- **State Management:** React Context API (`AuthContext`) handling token persistence and session lifecycle.
- **API Client:** Axios instance (`src/lib/api.ts`) configured with a base URL and an authorization request interceptor injecting JWT tokens.

### Backend
- **Runtime & Server:** Node.js with Express.js (v5) and TypeScript.
- **Database & ORM:** PostgreSQL managed through Prisma ORM (`prisma-client-js`). Note that while documentation references MySQL, schema and infrastructure have migrated to PostgreSQL.
- **Background Jobs:** `node-cron` orchestrating recurring subscription billing and reminder schedules.
- **Email Service:** Transactional email delivery powered by the Resend API.
- **Authentication:** Custom JWT-based authentication with bcrypt password hashing and 6-digit email verification codes.

---

## B. Important Files

### Frontend
- `frontend/src/main.tsx`: Application bootstrapping, mounting `BrowserRouter`, `AuthProvider`, and `ThemeProvider`.
- `frontend/src/App.tsx`: Central route mapping, separating public routes (`/login`, `/register`) from authenticated layout routes (`/dashboard`, `/balance`, `/subscriptions`, `/activity`, `/notes`, `/settings`).
- `frontend/src/contexts/AuthContext.tsx`: Authentication state management, handling login, registration, and logout operations.
- `frontend/src/lib/api.ts`: Central Axios client configured with JWT header injection.

### Backend
- `backend/follow-the-money-api/src/server.ts`: Server entry point listening on configured host and port.
- `backend/follow-the-money-api/src/app.ts`: Express application setup, CORS policy configuration, route registration, and centralized error handling.
- `backend/follow-the-money-api/prisma/schema.prisma`: Complete Prisma data model definition for Users, Accounts, Expenses, Subscriptions, Notes, and Account Actions.
- `backend/follow-the-money-api/src/controllers/auth.controller.ts`: Authentication request handlers (registration, verification codes, logins, profile inspection).
- `backend/follow-the-money-api/src/middleware/auth.ts`: Express middleware validating bearer tokens.
- `backend/follow-the-money-api/src/services/emailService.ts`: HTML email template generation and Resend client dispatch.

### Configuration & Infrastructure
- `docker-compose.postgres.yml`: Local PostgreSQL container configuration for development.
- `backend/follow-the-money-api/.env.example`: Template for backend environment variable configuration.

---

## C. How to Run the Project

### Prerequisites
- Node.js (v18+ recommended) and npm.
- Docker & Docker Compose (for local PostgreSQL).

### 1. Database
Start the local PostgreSQL container from the project root:
```bash
docker compose -f docker-compose.postgres.yml up -d
```

### 2. Backend API
```bash
cd backend/follow-the-money-api
npm install
npx prisma generate
npm run prisma:migrate:deploy
npm run dev
```

### 3. Frontend Client
```bash
cd frontend
npm install
npm run dev
```
The frontend starts on `http://localhost:5173` and proxies API requests to the backend on `http://localhost:4000`.

---

## D. Current Strengths
- **Clear Separation of Concerns:** Clean boundary between frontend client and backend REST API.
- **Modern Technologies:** Modern dependencies (React 19, Express 5, Tailwind CSS 4, Prisma ORM).
- **Extensive Type Safety:** Full TypeScript adoption across both frontend and backend layers.
- **Automated Workflows:** Transactional email triggers and recurring cron jobs already built into the core backend.
- **Modular Data Model:** Comprehensive relational schema covering multi-currency balances, account transfers, and recurring billing.

---

## E. Critical Problems
- **Documentation Discrepancy:** `README.md` documents MySQL as the primary database, while actual schema, Docker configurations, and migration scripts use PostgreSQL.
- **Insecure Verification Code Generation:** Email verification codes in `auth.controller.ts` are generated with `Math.random()`, which is not cryptographically secure and is susceptible to prediction attacks.
- **Missing Rate Limiting:** Verification and authentication endpoints have no rate limiting, allowing brute-force guessing of the 6-digit codes within their validity window.
- **Permissive CORS Fallback:** CORS configuration in `app.ts` allows any request where the `origin` header is absent, bypassing cross-origin restrictions for non-browser clients.

---

## F. Security Findings
- **Committed Environment Files:** Multiple `.env` configuration files (`.env`, `.env.supabase`, `.env.mysql.backup`) were committed into version control containing active API keys, database credentials, and secret strings.
- **Storage of JWTs in LocalStorage:** JWT tokens are persisted in browser `localStorage`, exposing session credentials to client-side Cross-Site Scripting (XSS) extraction.
- **Lack of Code Attempt Caps:** Failed verification attempts do not increment a retry counter, allowing unlimited guesses until expiration.

---

## G. Product and UX Problems
- **Session Expiration Handling:** The frontend lacks an automatic response interceptor for HTTP 401 errors, leaving users in broken UI states when tokens expire rather than redirecting to login.
- **Plaintext Financial Data at Rest:** Financial notes and expense descriptions are stored in unencrypted plaintext in the database without field-level protection.
- **Silent Code Invalidation:** Requesting a new verification code invalidates prior codes immediately without explicit UI notification, causing confusion if emails arrive delayed.

---

## H. Recommended Improvements Ordered by Priority
1. **Rotate Exposed Secrets:** Revoke and reissue all credentials previously present in `.env` files (database passwords, email API keys, JWT signing keys).
2. **Purge Git History & Enforce .gitignore:** Remove tracked `.env*` files from Git history and ensure `.gitignore` excludes them across all directories.
3. **Cryptographically Secure Verification:** Replace `Math.random()` with `crypto.randomInt(100000, 1000000)` in `auth.controller.ts`.
4. **Implement Rate Limiting:** Introduce rate limiting on `/auth` endpoints and enforce a maximum attempt limit (e.g., 5 failures) before invalidating codes.
5. **Harmonize Documentation:** Update `README.md` to reflect the active PostgreSQL architecture.
6. **Graceful Auth Expiration:** Add an Axios response interceptor to handle HTTP 401 by clearing storage and cleanly navigating to `/login`.

---

## I. Questions & Clarifications
- Are there active production users whose credentials or data must be migrated or reset following secret rotation?
- Should authentication be migrated from `localStorage` JWTs to `httpOnly` secure session cookies?
- Is historical data from the previous MySQL database still required, or is PostgreSQL the definitive datastore moving forward?
