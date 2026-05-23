import type { ReactNode } from "react";
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
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.14),transparent_30%)]" />
          <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:32px_32px]" />

          <div className="relative flex min-h-screen w-full flex-col px-10 py-10 xl:px-14 xl:py-12">
            <div className="flex justify-start">
              <img
                src="/logo.png"
                alt="Money Tracker logo"
                className="h-20 w-20 rounded-2xl object-contain xl:h-24 xl:w-24"
              />
            </div>

            <div className="flex flex-1 items-center">
              <div className="max-w-xl">
                <p className="mb-5 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-emerald-200">
                  {mode === "login" ? "Smart personal finance" : "Built for clarity"}
                </p>

                <h1 className="text-4xl font-black tracking-tight text-white xl:text-5xl">
                  {panelTitle}
                </h1>

                <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
                  {panelDescription}
                </p>

                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <WalletCards className="h-5 w-5 text-emerald-300" />
                    <p className="mt-3 text-sm font-semibold text-white">Accounts</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Everything visible in one place.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <ChartNoAxesCombined className="h-5 w-5 text-emerald-300" />
                    <p className="mt-3 text-sm font-semibold text-white">Clarity</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Know what is recurring and what is not.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <Lock className="h-5 w-5 text-emerald-300" />
                    <p className="mt-3 text-sm font-semibold text-white">Secure</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Simple, protected account access.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8 xl:px-10">
          <div className="w-full max-w-md">
            <div className="mb-10 flex justify-center lg:hidden">
              <img
                src="/logo.png"
                alt="Money Tracker logo"
                className="h-24 w-24 rounded-3xl object-contain sm:h-28 sm:w-28"
              />
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 sm:p-8">
              <div className="mb-8">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
                  {eyebrow}
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-[2rem]">
                  {title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
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