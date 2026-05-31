# Money Tracker

A full-stack personal finance tracker built with React, Vite, Express.js, Prisma, MySQL, and Railway.

## Overview

Money Tracker is an ongoing full-stack web application for managing personal finances in one place. It allows users to track accounts and resources, record expenses, manage recurring subscriptions, and monitor total balances across their financial data.

The project combines a React + Vite frontend with an Express.js backend, Prisma ORM, and MySQL database. It is designed as a practical real-world portfolio project focused on finance workflows, authentication, relational data handling, and production deployment with Railway.

## Features

- Secure user authentication.
- Account and resource management for tracking where money is stored.
- Expense tracking with balance updates tied to accounts.
- Subscription tracking for recurring payments.
- Dashboard totals across financial resources.
- Currency-aware finance flows, including ALL and EUR handling.
- Support for account balance logic and transfer-related finance flows.
- Backend API built with Express and Prisma.
- Railway-ready production setup using environment variables.

## Tech Stack

| Layer | Technologies |
|------|------|
| Frontend | React, Vite, TypeScript |
| Backend | Node.js, Express.js, TypeScript |
| Database | MySQL |
| ORM | Prisma |
| Deployment | Railway |

The stack was chosen to build a realistic full-stack finance application with a modern frontend, structured backend, relational database modeling, and straightforward deployment.

## Project Structure

```text
money-tracker/
├── backend/
│   └── follow-the-money-api/        # Express + Prisma API
│       ├── prisma/
│       │   ├── migrations/          # Database migration history
│       │   └── schema.prisma        # Prisma schema
│       ├── src/
│       │   ├── controllers/         # Request handlers
│       │   ├── cron/                # Scheduled jobs / reminders
│       │   ├── lib/                 # Shared backend helpers
│       │   ├── middleware/          # Auth and request middleware
│       │   ├── routes/              # API routes
│       │   ├── services/            # Business logic
│       │   ├── utils/               # Utility functions
│       │   ├── config.ts            # Environment/config loading
│       │   └── server.ts            # Backend entry point
│       ├── .env.example             # Example backend environment variables
│       ├── package.json
│       └── tsconfig.json
├── frontend/                        # React + Vite client
│   ├── public/
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   ├── contexts/                # React context providers
│   │   ├── lib/                     # Frontend shared logic
│   │   ├── pages/                   # Main app pages
│   │   ├── utils/                   # Utility helpers
│   │   ├── App.tsx                  # Root app component
│   │   └── main.tsx                 # Frontend entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── screenshots/
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
├── README.md
└── LICENSE
```

## Screenshots

Here are some screens from the current version of the application.

### Authentication

**Register**
![Register page](./screenshots/register.png)

**Login**
![Login page](./screenshots/login.png)

### Dashboard

**Dark mode**
![Dashboard dark mode](./screenshots/dashboard-dark.png)

**Light mode**
![Dashboard light mode](./screenshots/dashboard-light.png)

### Main Features

**Balances**
![Balances page](./screenshots/balances.png)

**Subscriptions**
![Subscriptions page](./screenshots/subscriptions.png)

**Activity**
![Activity page](./screenshots/activity.png)

**Notes**
![Notes page](./screenshots/notes.png)

### Settings

**Account management**
![Settings account section](./screenshots/settings-account.png)

**Preferences and notifications**
![Settings preferences and notifications](./screenshots/settings-preferences.png)

## Setup

### Prerequisites

Make sure you have:

- Node.js installed.
- npm installed.
- MySQL running locally or a remote MySQL database available.

### 1. Clone the repository

```bash
git clone https://github.com/eljomaneshi/money-tracker.git
cd money-tracker
```

### 2. Create the backend environment file

Copy the example file:

```bash
cp backend/follow-the-money-api/.env.example backend/follow-the-money-api/.env
```

On Windows PowerShell:

```powershell
Copy-Item "backend/follow-the-money-api/.env.example" "backend/follow-the-money-api/.env"
```

Then update the values in:

```text
backend/follow-the-money-api/.env
```

### 3. Install dependencies

Frontend:

```bash
cd frontend
npm install
```

Backend:

```bash
cd ../backend/follow-the-money-api
npm install
```

### 4. Generate Prisma client

From the backend folder:

```bash
npx prisma generate
```

### 5. Run the backend

```bash
npm run dev
```

### 6. Run the frontend

Open a new terminal and run:

```bash
cd frontend
npm run dev
```

The frontend will typically run on `http://localhost:5173`, and the backend will run on its configured port.

## Environment Variables

The backend example file is located at:

```text
backend/follow-the-money-api/.env.example
```

Create a local `.env` file from that example and provide real values.

### Example

```env
PORT=3000
NODE_ENV=development

DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE_NAME

JWT_SECRET=replace_with_a_long_random_secret

RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
EMAIL_FROM=you@example.com

FRONTEND_URL=http://localhost:5173
```

### Notes

- Never commit a real `.env` file.
- Use `.env.example` only for documentation and placeholders.
- In production, secrets should be stored in Railway Variables instead of the repository.

## Database and Prisma

The backend uses Prisma with MySQL for schema management and data access. Prisma handles the database models, client generation, and migrations used by the API.

Useful backend commands:

```bash
npx prisma generate
npx prisma migrate dev
```

Run them from:

```text
backend/follow-the-money-api
```

## Deployment

The project is deployed with Railway. Railway is used to manage backend environment variables and production configuration instead of storing real secrets in the repository.

### Backend deployment

Important production variables include:

- `DATABASE_URL`
- `JWT_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `FRONTEND_URL`

### Important deployment note

A real `.env` file is used only for local development. Production secrets are managed in Railway and should never be committed to GitHub.

### Suggested deployment flow

1. Push your latest code to GitHub.
2. Make sure the Railway backend service is connected to the correct repository and branch.
3. Confirm all required variables are set in Railway.
4. Redeploy after important backend config changes if needed.

## Security Notes

- Real `.env` files should stay local only.
- The repository includes an example env file for setup guidance.
- Git history and tracked files should be checked before making a repository public. Secret scanning is a good practice for that workflow.
- Production secrets should live in Railway Variables, not in source control.

## Roadmap

Planned or possible future improvements include:

- More dashboard polish and analytics.
- Additional reporting and balance insights.
- Continued refinement of currency handling and account transfer flows.
- UI improvements and possible theme support.
- More polished auth and account-related screens.

## License

This project is licensed under the MIT License.

See the [LICENSE](./LICENSE) file for the full text.
