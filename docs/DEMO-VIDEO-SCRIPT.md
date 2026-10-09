# MoneyTracker — Demo Video Walkthrough Script (3–5 Minutes)

## Demo Environment & Recording Precautions

> **Demo Environment Note:** A seeded demo account does not exist in the repository. The founder must decide whether to set up a separate demo environment with synthetic data before recording. Never record real accounts, balances, or private inboxes.
>
> **Before Recording Checklist:**
> - **Synthetic Data:** Use placeholder records only `[insert synthetic demo example after setup]`.
> - **Clean Profile:** Hide bookmarks, history, and extensions in a dedicated browser window.
> - **Disable Autofill:** Turn off autofill and password manager popups.
> - **Hide Sensitive Screens:** Keep terminals, `.env` files, cloud consoles, and inboxes off-screen.
> - **Notifications & Privacy:** Silence alerts; blur any accidental personal details.
> - **Demo Credentials:** Use `[use a dedicated demo account; share credentials separately through a controlled channel]`.

---

## Walkthrough Script

### 1. Opening: Founder Project & Problem (0:00–0:30)
- **Visual:** Landing page hero on `https://moneytracker.online` or camera introduction.
- **Narration:**  
  "Hi, I'm Eljo, solo founder of MoneyTracker. Traditional finance apps often require sharing bank credentials with aggregators who scrape transaction data. Spreadsheets preserve privacy, but lack automated reminders and unified multi-currency tracking. I built MoneyTracker as a sovereign workspace to track cashflow, subscriptions, and financial notes without connecting bank accounts. It is strictly an organizational record-keeping tool and does not provide financial or tax advice."

### 2. Landing Page & Sign-In (0:30–1:00)
- **Visual:** Scroll through landing feature cards and footer trust links (Privacy, Terms, Security). Navigate to `/login`.
- **Narration:**  
  "The landing page outlines our manual tracking model and links to transparent privacy and security policies. I'll sign in using our dedicated demo account `[use a dedicated demo account; share credentials separately through a controlled channel]`. Authentication uses custom bcrypt hashing, rate limiting, and client-side session tokens, with zero third-party advertising trackers."

### 3. Dashboard & Multi-Currency Balances (1:00–1:45)
- **Visual:** View `/dashboard` (Net Overview, StatCards), navigate to `/balance`, and open Quick Action modal.
- **Narration:**  
  "The Dashboard displays net balances across currencies like EUR, ALL, USD, or GBP `[insert synthetic demo example after setup]`. On Balances, accounts are grouped by type—Bank, Cash, or Crypto. Through Quick Actions, users record deposits, withdrawals, or inter-account transfers with automatic balance math, keeping books accurate without live bank feeds."

### 4. Activity Ledger, Entry & Export (1:45–2:30)
- **Visual:** Open `/activity`. Show filters, 25-item pagination, log a sample expense, and click 'Export PDF'.
- **Narration:**  
  "The Activity ledger unifies expenses and account actions with 25-item pagination. Users can filter by account, category, or date range. Logging an expense `[insert synthetic demo example after setup]` updates balances immediately. For offline records, 'Export PDF' generates a formatted statement in the browser using jsPDF, keeping data on the user's device."

### 5. Subscriptions & Notes (2:30–3:15)
- **Visual:** Open `/subscriptions` (timeline and cards). Navigate to `/notes` (searchable task cards and status toggles).
- **Narration:**  
  "The Subscriptions workspace tracks recurring commitments with a visual renewal timeline and background email reminders. The Notes workspace organizes financial tasks, payables, receivables, and reminders with status filters, providing a dedicated space for money-related to-dos without mixing them into general note apps."

### 6. Settings, Data Portability & Privacy Controls (3:15–4:00)
- **Visual:** In `/settings`, show Currency preferences, export cards (JSON / CSV), the AI Insights prototype card and inspection modal, and the Danger Zone.
- **Narration:**  
  "Users retain full data ownership. In Settings, users can configure dual currencies and export a complete JSON archive or CSV ledger anytime. An architectural prototype for AI insights exists in code with a payload inspection modal, but backend routes are unmounted and inactive in production. For closure, the Danger Zone provides self-serve deletion that wipes active records."

### 7. Honest Closing & Current Status (4:00–4:30)
- **Visual:** Return to Dashboard or display contact email (`founder@moneytracker.online`).
- **Narration:**  
  "MoneyTracker is fully functional end-to-end, but as a solo founder, I am currently the only user. There are no external users, testimonials, or revenue yet. We are preparing our first Claude for Startups application to gather structured feedback from privacy-conscious users and carefully validate privacy-first AI assistance over aggregated metrics. Thank you for watching."
