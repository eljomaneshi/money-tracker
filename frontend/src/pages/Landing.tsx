import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  FileDown,
  Lock,
  Mail,
  NotebookText,
  Repeat,
  ShieldCheck,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react";
import { ThemeToggle } from "../components/theme-toggle";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

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
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 transition-colors duration-150 dark:bg-[#070b14] dark:text-slate-100">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-[#070b14]/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="group flex items-center gap-3 transition-opacity hover:opacity-90"
            title="Money Tracker Home"
          >
            <div className="relative">
              <img
                src="/logo.png"
                alt="Money Tracker logo"
                className="h-10 w-10 rounded-2xl object-contain ring-1 ring-slate-200 shadow-sm transition-transform group-hover:scale-105 dark:ring-white/10"
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-[#070b14]" />
            </div>
            <div>
              <span className="block text-base font-bold leading-tight tracking-tight text-slate-900 sm:text-lg dark:text-white">
                Money Tracker
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-600 sm:text-xs dark:text-emerald-400">
                Privacy-First FinTech
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/login")}
            >
              Sign in
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/register")}
            >
              Create account
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-14 pb-16 sm:px-6 sm:pt-24 sm:pb-24 lg:px-8">
        {/* Ambient Radial Mesh & Grid */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.06),transparent_40%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:36px_36px]" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 backdrop-blur-sm dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Personal Finance Workspace</span>
          </div>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
            Take control of your everyday finances.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg sm:leading-8 dark:text-slate-300">
            Track balances, expenses, transfers, recurring subscriptions, and
            financial notes in one place.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button
              size="lg"
              variant="primary"
              rightIcon={<ArrowRight className="h-4 w-4" />}
              onClick={() => navigate("/register")}
              className="w-full shadow-md shadow-emerald-500/20 sm:w-auto"
            >
              Create account
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/login")}
              className="w-full sm:w-auto"
            >
              Sign in
            </Button>
          </div>

          {/* Trust Telemetry Badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-slate-600 sm:gap-4 dark:text-slate-400">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 backdrop-blur-sm dark:border-white/10 dark:bg-[#0d1526]/80">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Privacy-First Architecture</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 backdrop-blur-sm dark:border-white/10 dark:bg-[#0d1526]/80">
              <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>No Bank Credentials Needed</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 backdrop-blur-sm dark:border-white/10 dark:bg-[#0d1526]/80">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Zero Tracker Cookies</span>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Features Grid */}
      <section className="border-t border-slate-200/80 bg-white/50 py-16 backdrop-blur-sm dark:border-white/10 dark:bg-[#0d1526]/30 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Core Capabilities</span>
            </div>
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
                <Card
                  key={feature.title}
                  hover={true}
                  padding="md"
                  className="border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#0d1526]"
                >
                  <div className="inline-flex rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-slate-950 dark:text-slate-100">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-[#0b1120] via-[#0d1526] to-[#070b14] p-8 text-center text-white shadow-2xl dark:border-white/10 sm:p-12">
          {/* Subtle Ambient Glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_60%)]" />

          <div className="relative z-10">
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Ready to organize your finances?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Get started in seconds with email verification. No spreadsheets or complex setups required.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Button
                size="lg"
                variant="primary"
                rightIcon={<ArrowRight className="h-4 w-4" />}
                onClick={() => navigate("/register")}
                className="w-full shadow-md shadow-emerald-500/20 sm:w-auto"
              >
                Get started
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/login")}
                className="w-full border-white/20 text-white hover:bg-white/10 sm:w-auto dark:border-white/20 dark:text-white dark:hover:bg-white/10"
              >
                Sign in to your account
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/60 py-10 backdrop-blur-md dark:border-white/10 dark:bg-[#070b14]/80">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 text-sm md:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="/logo.png"
                alt="Money Tracker logo"
                className="h-8 w-8 rounded-xl object-contain ring-1 ring-slate-200 dark:ring-white/10"
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-[#070b14]" />
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">
              Money Tracker
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Personal finance workspace
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600 dark:text-slate-400">
            <Link
              to="/privacy"
              className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              Privacy &amp; Data Handling
            </Link>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Link
              to="/terms"
              className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              Terms of Use
            </Link>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Link
              to="/security"
              className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              Security Overview
            </Link>
          </div>

          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <a
              href="mailto:founder@moneytracker.online"
              className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-emerald-600 dark:text-slate-300 dark:decoration-slate-700 dark:hover:text-emerald-400"
            >
              founder@moneytracker.online
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
