# MoneyTracker Improvement Roadmap

This roadmap outlines targeted improvements to prepare MoneyTracker for public users, investor/startup presentations, future Claude/AI integrations, and reliable production operations.

---

## P0 - Critical Security or Data-Loss Problems

### 1. Secret Rotation and Git History Sanitization
- **Task Title:** Rotate all exposed secrets and purge environment files from Git history.
- **Why It Matters:** Active credentials (database connection strings, email service API keys, and JWT secrets) were previously present in tracked `.env` files in source control. Any entity with repository read access could compromise database integrity and send unauthorized emails.
- **Exact Files Likely to Change:** `.gitignore`, `backend/follow-the-money-api/.gitignore`, `.git` repository history (via filtering tool).
- **Dependencies:** Database provider dashboard (Supabase / local), Resend dashboard, Railway/hosting platform variables.
- **Risk of Changing It:** High. History rewrites require team re-cloning. Production downtime will occur if hosting environment variables are not updated synchronously with rotated secrets.
- **How to Test It:** Verify with `git log` and fresh repository clones that no `.env*` files exist in any commit. Verify backend successfully boots and connects using newly populated environment variables.
- **Completed Before Claude for Startups Application:** **YES.**

---

### 2. Cryptographically Secure Verification Code Generation
- **Task Title:** Replace `Math.random()` with a CSPRNG for verification codes.
- **Why It Matters:** Verification codes currently use `Math.random()`, which produces predictable sequences. Attackers can exploit this to anticipate verification codes and hijack user accounts or registration flows.
- **Exact Files Likely to Change:** `backend/follow-the-money-api/src/controllers/auth.controller.ts`.
- **Dependencies:** Node.js standard library `crypto` module.
- **Risk of Changing It:** Low. Isolated to internal code generation logic.
- **How to Test It:** Trigger the verification flow, confirm a 6-digit code is generated via `crypto.randomInt()`, and verify successful code validation upon submission.
- **Completed Before Claude for Startups Application:** **YES.**

---

### 3. Rate Limiting and Verification Code Attempt Caps
- **Task Title:** Enforce endpoint rate limiting and attempt limits on email verification.
- **Why It Matters:** The 6-digit code has a 10-minute lifetime with no rate limit or attempt counter, making it vulnerable to brute-force guessing attacks.
- **Exact Files Likely to Change:** `backend/follow-the-money-api/src/app.ts`, `backend/follow-the-money-api/src/controllers/auth.controller.ts`, `backend/follow-the-money-api/package.json`.
- **Dependencies:** `express-rate-limit`.
- **Risk of Changing It:** Medium. Misconfigured rate limiting could temporarily block valid users behind shared networks/NATs.
- **How to Test It:** Execute repeated invalid verification requests against `/auth/register-with-code`. Verify that the endpoint returns HTTP 429 after exceeding thresholds and invalidates the code after 5 consecutive failures.
- **Completed Before Claude for Startups Application:** **YES.**

---

## P1 - Problems That Can Block Real Users

### 4. Documentation and Database Engine Alignment
- **Task Title:** Synchronize project setup documentation with PostgreSQL architecture.
- **Why It Matters:** The documentation refers to MySQL, while database schemas, Docker configurations, and migration scripts run on PostgreSQL. New contributors and technical reviewers cannot set up the application from scratch without encountering errors.
- **Exact Files Likely to Change:** `README.md`.
- **Dependencies:** None.
- **Risk of Changing It:** None.
- **How to Test It:** Run through the setup instructions from a clean environment using only Docker and npm commands listed in the updated README.
- **Completed Before Claude for Startups Application:** **YES.**

---

### 5. Graceful Session Expiration and 401 Interception
- **Task Title:** Implement global Axios 401 response handling and session cleanup.
- **Why It Matters:** When a JWT expires, API calls fail with 401 Unauthorized, but the frontend maintains stale state without redirecting, leaving the user with broken dashboards and unresponsive actions.
- **Exact Files Likely to Change:** `frontend/src/lib/api.ts`, `frontend/src/contexts/AuthContext.tsx`, `frontend/src/App.tsx`.
- **Dependencies:** None.
- **Risk of Changing It:** Medium. Interceptor must handle infinite loop edge cases during login attempts.
- **How to Test It:** Invalidate the token in `localStorage`, trigger an API operation, and confirm the user is smoothly redirected to `/login` with an informative message.
- **Completed Before Claude for Startups Application:** **YES.**

---

### 6. Fix Silent Failure in End-to-End Test Suite
- **Task Title:** Correct `process.exit(0)` error masking in the test script.
- **Why It Matters:** `scripts/test-e2e-api.ts` invokes `process.exit(0)` unconditionally within a `finally` block, hiding runtime and database errors and falsely reporting a passing test run to CI/CD.
- **Exact Files Likely to Change:** `backend/follow-the-money-api/scripts/test-e2e-api.ts`.
- **Dependencies:** None.
- **Risk of Changing It:** Low.
- **How to Test It:** Run `npm run test:e2e` when the database is stopped. Verify the script exits with code 1 and outputs the full connection error stack.
- **Completed Before Claude for Startups Application:** **YES.**

---

## P2 - Important Product and UX Improvements

### 7. Application-Level Field Encryption for Sensitive Financial Notes
- **Task Title:** Encrypt sensitive financial descriptions and private notes at rest.
- **Why It Matters:** User transaction descriptions and notes contain private financial context. Encrypting these at the application layer protects data even if database snapshots are exposed, and provides a clear privacy boundary before future AI integrations.
- **Exact Files Likely to Change:** `backend/follow-the-money-api/src/controllers/expense.controller.ts`, `backend/follow-the-money-api/src/controllers/note.controller.ts`, `backend/follow-the-money-api/src/utils/encryption.ts` (new).
- **Dependencies:** Node.js `crypto` module.
- **Risk of Changing It:** High. Requires careful handling of encryption keys and data migration for existing rows to prevent permanent data loss.
- **How to Test It:** Create expenses and notes; verify database stores encrypted cipher text; verify API returns clear decrypted strings to authenticated owners.
- **Completed Before Claude for Startups Application:** No (recommended post-application or as a roadmap milestone).

---

### 8. Strict CORS Configuration
- **Task Title:** Restrict API cross-origin requests to explicit client origins.
- **Why It Matters:** The current CORS middleware permits any request missing an origin header, weakening defenses against non-browser abuse and cross-site scripting tools.
- **Exact Files Likely to Change:** `backend/follow-the-money-api/src/app.ts`.
- **Dependencies:** None.
- **Risk of Changing It:** Low.
- **How to Test It:** Test requests with missing or unauthorized origins and confirm they receive an appropriate HTTP 403 response.
- **Completed Before Claude for Startups Application:** No.

---

## P3 - Nice-to-Have Improvements

### 9. AI Financial Insights Abstraction Layer
- **Task Title:** Create an isolated service for LLM-driven financial summaries.
- **Why It Matters:** Preparing an abstraction layer that aggregates and sanitizes financial transactions before sending them to Claude/Anthropic APIs ensures future AI features can be added without leaking raw PII.
- **Exact Files Likely to Change:** `backend/follow-the-money-api/src/services/ai.service.ts` (new), `backend/follow-the-money-api/src/controllers/ai.controller.ts` (new).
- **Dependencies:** `@anthropic-ai/sdk` (future).
- **Risk of Changing It:** Low. Non-intrusive feature addition.
- **How to Test It:** Unit test the data sanitizer to ensure names and account identifiers are masked prior to prompt construction.
- **Completed Before Claude for Startups Application:** No (ideal demonstration feature after acceptance).

---

### 10. Frontend Bundle Optimization and Code Splitting
- **Task Title:** Introduce dynamic imports for large client libraries.
- **Why It Matters:** Build diagnostics indicate production chunks exceed 500 kB (due to PDF generation and canvas libraries), which impacts initial page load performance on mobile networks.
- **Exact Files Likely to Change:** `frontend/src/App.tsx`, `frontend/vite.config.ts`.
- **Dependencies:** None.
- **Risk of Changing It:** Low.
- **How to Test It:** Run `npm run build` in `frontend/` and verify generated chunk sizes remain within recommended limits.
- **Completed Before Claude for Startups Application:** No.
