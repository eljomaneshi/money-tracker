import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { ThemeToggle } from "./theme-toggle";

type TrustPageShellProps = {
  title: string;
  lastUpdated: string;
  children: ReactNode;
};

export default function TrustPageShell({
  title,
  lastUpdated,
  children,
}: TrustPageShellProps) {
  const { token } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-150 dark:bg-slate-950 dark:text-slate-100">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
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

            {token ? (
              <>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl bg-teal-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 sm:px-4 sm:py-2.5"
                >
                  Dashboard
                </Link>
                <Link
                  to="/settings"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:px-4 sm:py-2.5"
                >
                  Settings
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:px-4 sm:py-2.5"
                >
                  Home
                </Link>
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
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800/90 dark:bg-slate-900 sm:p-10">
          <header className="border-b border-slate-200 pb-6 dark:border-slate-800">
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">
              {title}
            </h1>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Last updated: {lastUpdated}
            </p>
          </header>

          <article className="mt-8 space-y-8 text-base leading-relaxed text-slate-700 dark:text-slate-300">
            {children}
          </article>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 px-4 text-sm sm:flex-row sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600 dark:text-slate-400">
            <Link
              to="/privacy"
              className="transition hover:text-teal-600 dark:hover:text-teal-400"
            >
              Privacy & Data Handling
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
