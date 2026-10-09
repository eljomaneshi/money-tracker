import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChartNoAxesCombined, Lock, WalletCards } from "lucide-react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  mode: "login" | "register";
};

export default function AuthShell({
  eyebrow,
  title,
  description,
  children,
  mode,
}: AuthShellProps) {
  const panelTitle =
    mode === "login"
      ? "See your money clearly, every single month."
      : "Build better money habits with one organized system.";

  const panelDescription =
    mode === "login"
      ? "Track balances, monitor recurring subscriptions, and keep your spending organized in one calm, focused workspace."
      : "Create your account to manage balances, recurring subscriptions, and everyday spending from one dashboard.";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 dark:bg-[#070b14] dark:text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        {/* Left Marketing Panel (Obsidian & Mint Precision) */}
        <section className="relative hidden overflow-hidden bg-[#070b14] lg:flex border-r border-white/8">
          {/* Ambient Radial Mesh */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.10),transparent_35%)]" />
          {/* Subtle Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:36px_36px]" />

          <div className="relative flex min-h-screen w-full flex-col px-10 py-10 xl:px-14 xl:py-12">
            <div className="flex justify-start">
              <Link
                to="/"
                className="group flex items-center gap-3 transition-opacity hover:opacity-90"
                title="Money Tracker Home"
              >
                <div className="relative">
                  <img
                    src="/logo.png"
                    alt="Money Tracker logo"
                    className="h-14 w-14 rounded-2xl object-contain ring-1 ring-white/10 shadow-lg transition-transform group-hover:scale-105"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#070b14] bg-emerald-500" />
                </div>
                <div>
                  <span className="block text-lg font-extrabold tracking-tight text-white leading-tight">
                    Money Tracker
                  </span>
                  <span className="block text-xs font-semibold text-emerald-400 tracking-wider uppercase">
                    Privacy-First FinTech
                  </span>
                </div>
              </Link>
            </div>

            <div className="flex flex-1 items-center">
              <div className="max-w-xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>{mode === "login" ? "Smart personal finance" : "Built for clarity"}</span>
                </div>

                <h1 className="text-4xl font-extrabold tracking-tight text-white xl:text-5xl leading-[1.15]">
                  {panelTitle}
                </h1>

                <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-300">
                  {panelDescription}
                </p>

                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4.5 backdrop-blur-md transition-all hover:bg-white/[0.05] hover:border-white/15">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                      <WalletCards className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-bold text-white">Accounts</p>
                    <p className="mt-1 text-xs text-slate-400 leading-normal">
                      Every cash and bank balance in unified view.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4.5 backdrop-blur-md transition-all hover:bg-white/[0.05] hover:border-white/15">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                      <ChartNoAxesCombined className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-bold text-white">Clarity</p>
                    <p className="mt-1 text-xs text-slate-400 leading-normal">
                      Instant separation of recurring vs daily spend.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4.5 backdrop-blur-md transition-all hover:bg-white/[0.05] hover:border-white/15">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-bold text-white">Private</p>
                    <p className="mt-1 text-xs text-slate-400 leading-normal">
                      Zero tracker cookies, scoped data isolation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-6 border-t border-white/5">
              <span>&copy; {new Date().getFullYear()} Money Tracker</span>
              <div className="flex items-center gap-4">
                <Link to="/privacy" className="hover:text-slate-200 transition-colors">Privacy</Link>
                <Link to="/terms" className="hover:text-slate-200 transition-colors">Terms</Link>
                <Link to="/security" className="hover:text-slate-200 transition-colors">Security</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Right Form Card Panel */}
        <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8 xl:px-10">
          <div className="w-full max-w-md">
            {/* Mobile Brand Logo */}
            <div className="mb-8 flex justify-center lg:hidden">
              <Link to="/" className="group flex flex-col items-center gap-2" title="Money Tracker">
                <div className="relative">
                  <img
                    src="/logo.png"
                    alt="Money Tracker logo"
                    className="h-16 w-16 rounded-2xl object-contain ring-1 ring-slate-200 dark:ring-white/10 shadow-lg"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-[#070b14] bg-emerald-500" />
                </div>
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Money Tracker
                </span>
              </Link>
            </div>

            {/* Form Card Container */}
            <div className="rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 backdrop-blur-md dark:border-white/10 dark:bg-[#0b1120] dark:shadow-2xl dark:shadow-black/50 sm:p-8">
              <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                  {eyebrow}
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              </div>

              {children}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}