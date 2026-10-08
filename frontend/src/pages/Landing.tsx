import { Link } from "react-router-dom";
import {
  ArrowLeftRight,
  ArrowRight,
  FileDown,
  Mail,
  NotebookText,
  Repeat,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react";
import { ThemeToggle } from "../components/theme-toggle";

const features = [
  {
    icon: WalletCards,
    title: "Multi-Currency Accounts",
    description:
      "Manage bank, cash, and other financial accounts with support for EUR, ALL, USD, and GBP exchange rate calculations.",
  },
  {
    icon: ArrowLeftRight,
    title: "Track Money Movement",
    description:
      "Record expenses, deposits, withdrawals, and account-to-account transfers with automatic balance updates.",
  },
  {
    icon: Repeat,
    title: "Recurring Subscriptions",
    description:
      "Keep tabs on monthly and annual subscriptions with renewal dates and scheduled billing reminders.",
  },
  {
    icon: NotebookText,
    title: "Financial Notes",
    description:
      "Organize financial tasks, payables, receivables, and reminders in one dedicated, searchable workspace.",
  },
  {
    icon: FileDown,
    title: "Activity Filters & PDF Export",
    description:
      "Filter transactions by date, category, and account, and generate downloadable PDF reports directly in your browser.",
  },
  {
    icon: SlidersHorizontal,
    title: "Account Deletion Controls",
    description:
      "Delete your MoneyTracker account from Settings after a confirmation step whenever you choose.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-150 dark:bg-slate-950 dark:text-slate-100">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Money Tracker logo"
              className="h-10 w-10 rounded-xl object-contain shadow-sm"
            />
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Money Tracker
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:px-4 sm:py-2.5"
            >
              Sign in
            </Link>

            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-2xl bg-teal-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 sm:px-4 sm:py-2.5"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-teal-800 dark:border-teal-900/60 dark:bg-teal-950/50 dark:text-teal-300">
            Personal Finance Workspace
          </span>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
            Take control of your everyday finances.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg sm:leading-8 dark:text-slate-300">
            Track balances, expenses, transfers, recurring subscriptions, and
            financial notes in one place.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              to="/register"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-teal-600/20 transition hover:bg-teal-700 sm:w-auto"
            >
              <span>Create account</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:w-auto"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Verified Features Grid */}
      <section className="border-t border-slate-200/80 bg-white/60 py-16 backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/40 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
              Built for day-to-day financial clarity
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              Everything you need to organize where your money sits and where it goes.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="inline-flex rounded-2xl bg-teal-100 p-3 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-slate-950 dark:text-slate-100">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-[#10203a] to-slate-900 p-8 text-center text-white shadow-xl dark:border-slate-800 sm:p-12">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
            Ready to organize your finances?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
            Get started in seconds with email verification. No spreadsheets or complex setups required.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              to="/register"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-500 px-6 py-3.5 text-base font-semibold text-slate-950 shadow-md transition hover:bg-teal-400 sm:w-auto"
            >
              <span>Get started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-white/20 sm:w-auto"
            >
              Sign in to your account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 text-sm md:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Money Tracker logo"
              className="h-8 w-8 rounded-lg object-contain"
            />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Money Tracker
            </span>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Personal finance tracker
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600 dark:text-slate-400">
            <Link
              to="/privacy"
              className="transition hover:text-teal-600 dark:hover:text-teal-400"
            >
              Privacy &amp; Data Handling
            </Link>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Link
              to="/terms"
              className="transition hover:text-teal-600 dark:hover:text-teal-400"
            >
              Terms of Use
            </Link>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Link
              to="/security"
              className="transition hover:text-teal-600 dark:hover:text-teal-400"
            >
              Security Overview
            </Link>
          </div>

          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Mail className="h-4 w-4" />
            <a
              href="mailto:founder@moneytracker.online"
              className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-teal-600 dark:text-slate-300 dark:decoration-slate-700 dark:hover:text-teal-400"
            >
              founder@moneytracker.online
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
