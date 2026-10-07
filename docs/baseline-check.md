# Baseline Diagnostic Check Results

This document records the baseline verification commands executed across the frontend and backend workspaces. All diagnostic checks were performed in read-only mode without altering application code.

---

## 1. Commands Executed

### Frontend (`frontend/`)
- **Dependency Inspection:** `npm list --depth=0`
- **Type Checking:** `npx tsc -b`
- **Linting:** `npm run lint`
- **Test Command Inspection:** `npm test`
- **Production Build:** `npm run build`

### Backend (`backend/follow-the-money-api/`)
- **Dependency Inspection:** `npm list --depth=0`
- **Type Checking:** `npx tsc --noEmit`
- **Production Build:** `npm run build`
- **Lint Script Check:** `npm run lint`
- **Direct ESLint Run:** `npx eslint src`
- **Test Script Check:** `npm test`
- **End-to-End Test Suite:** `npm run test:e2e`
- **Database & Container Diagnostics:** `docker ps` and `npx prisma migrate status`

---

## 2. Successful Checks

- **Frontend Dependency Resolution:** All frontend dependencies in `package.json` resolve without missing root packages.
- **Frontend Type Checking:** `npx tsc -b` exited with code `0` (zero TypeScript errors).
- **Frontend Production Build:** `npm run build` succeeded, compiling assets into `dist/` in ~1.06s.
- **Backend Dependency Resolution:** All backend dependencies resolve cleanly.
- **Backend Type Checking:** `npx tsc --noEmit` exited with code `0` (zero TypeScript errors).
- **Backend Production Build:** `npm run build` succeeded, compiling TypeScript files to `dist/` with exit code `0`.

---

## 3. Failed Checks

1. **Frontend Linting (`npm run lint`):** Failed with exit code `1` (37 errors, 4 warnings). Errors primarily stem from `@typescript-eslint/no-explicit-any` and a synchronous state update within a `useEffect` hook.
2. **Frontend Tests (`npm test`):** Failed with exit code `1` (No `test` script defined in `package.json`).
3. **Backend Lint Script (`npm run lint`):** Failed with exit code `1` (No `lint` script defined in `package.json`).
4. **Backend ESLint Direct Execution (`npx eslint src`):** Failed with exit code `1` (Missing ESLint flat configuration file `eslint.config.js`).
5. **Backend Unit/Integration Tests (`npm test`):** Failed with exit code `1` (No `test` script defined in `package.json`).
6. **Container & Database Accessibility (`docker ps` / `npx prisma migrate status`):** Failed with exit code `1` (Docker daemon is not running on the host system; PostgreSQL on `localhost:5432` is unreachable).
7. **Backend E2E Test Suite (`npm run test:e2e`):** Failed at Step 2 due to unreachable database. Note: A bug in `scripts/test-e2e-api.ts` caused an unconditional `process.exit(0)` inside the `finally` block, masking the error.

---

## 4. Error Messages & Logs

### Frontend Linting (`npm run lint`)
```text
✖ 41 problems (37 errors, 4 warnings)

frontend/src/pages/Register.tsx
  41:19  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  67:19  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

frontend/src/pages/Settings.tsx
  88:23  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  ...

frontend/src/pages/Subscriptions.tsx
  113:5   error  Error: Calling setState synchronously within an effect can trigger cascading renders  react-hooks/set-state-in-effect
```

### Missing Scripts (`npm test` & `backend/ npm run lint`)
```text
npm error Missing script: "test"
npm error 
npm error To see a list of scripts, run:
npm error   npm run
```

### Backend ESLint Execution (`npx eslint src`)
```text
Oops! Something went wrong! :(

ESLint: 10.1.0

ESLint couldn't find an eslint.config.(js|mjs|cjs) file.
From ESLint v9.0.0, the default configuration file is now eslint.config.js.
```

### Database Connection (`npx prisma migrate status`)
```text
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "money_tracker", schema "public" at "localhost:5432"
Error: P1001: Can't reach database server at `localhost:5432`

Please make sure your database server is running at `localhost:5432`.
```

### Docker Daemon (`docker ps`)
```text
failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine; check if the path is correct and if the daemon is running
```

---

## 5. Recommended Next Task

1. **Security Remediation (P0):** Rotate exposed credentials (database credentials, email service keys, JWT secrets) and ensure `.env*` files are removed from Git tracking and added to `.gitignore`.
2. **Correct E2E Test Exit Logic:** Update `scripts/test-e2e-api.ts` to ensure thrown connection errors properly exit with code 1 rather than being swallowed by `finally`.
3. **Local Database Verification:** Start Docker Desktop and launch PostgreSQL via `docker compose -f docker-compose.postgres.yml up -d` before re-running migration verification and E2E tests.
