import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

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
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#f8fafc] text-slate-900 transition-colors duration-150 dark:bg-[#070b14] dark:text-slate-100">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-[#070b14]/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
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

            {token ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/dashboard")}
                >
                  Dashboard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/settings")}
                >
                  Settings
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/")}
                  className="hidden sm:inline-flex"
                >
                  Home
                </Button>
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
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Card
          padding="lg"
          className="border-slate-200/80 bg-white shadow-xl shadow-slate-200/40 dark:border-white/10 dark:bg-[#0d1526] dark:shadow-2xl dark:shadow-black/50"
        >
          <header className="border-b border-slate-200/80 pb-6 dark:border-white/10">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Trust &amp; Transparency</span>
            </div>
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
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/60 py-10 backdrop-blur-md dark:border-white/10 dark:bg-[#070b14]/80">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 px-4 text-sm sm:flex-row sm:px-6 lg:px-8">
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
