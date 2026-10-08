import { useEffect, useState } from "react";
import { ArrowRight, Check, Sparkles, X } from "lucide-react";
import { Link } from "react-router-dom";

interface OnboardingChecklistProps {
  accountsCount: number;
  expensesCount: number;
  subscriptionsCount: number;
  userEmail?: string | null;
  loading?: boolean;
}

export default function OnboardingChecklist({
  accountsCount,
  expensesCount,
  subscriptionsCount,
  userEmail,
  loading = false,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!userEmail) return;
    try {
      const stored = localStorage.getItem(
        `moneytracker_onboarding_dismissed_${userEmail}`
      );
      if (stored === "true") {
        setDismissed(true);
      }
    } catch {
      // Ignore localStorage access errors
    }
  }, [userEmail]);

  const handleDismiss = () => {
    if (!userEmail) return;
    try {
      localStorage.setItem(
        `moneytracker_onboarding_dismissed_${userEmail}`,
        "true"
      );
    } catch {
      // Ignore localStorage access errors
    }
    setDismissed(true);
  };

  const hasAccounts = accountsCount > 0;
  const hasExpenses = expensesCount > 0;
  const hasSubscriptions = subscriptionsCount > 0;

  const completedCount =
    (hasAccounts ? 1 : 0) +
    (hasExpenses ? 1 : 0) +
    (hasSubscriptions ? 1 : 0);

  const allCompleted = completedCount === 3;

  if (loading || dismissed || allCompleted) {
    return null;
  }

  const steps = [
    {
      id: "accounts",
      title: "Add an initial balance or account",
      description:
        "Set up your bank accounts, cash wallets, or crypto balances to track your total net worth.",
      to: "/balances",
      actionText: "Add account",
      completed: hasAccounts,
    },
    {
      id: "expenses",
      title: "Record your first expense",
      description:
        "Log a recent expense or transaction to start analyzing your monthly cash outflow.",
      to: "/activity",
      actionText: "Add expense",
      completed: hasExpenses,
    },
    {
      id: "subscriptions",
      title: "Track a recurring subscription",
      description:
        "Add recurring monthly or yearly services to predict upcoming renewals and billing.",
      to: "/subscriptions",
      actionText: "Add subscription",
      completed: hasSubscriptions,
    },
  ];

  return (
    <section
      aria-labelledby="onboarding-checklist-title"
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/6 dark:bg-[#0f1b3d] sm:p-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="rounded-2xl bg-teal-100 p-2.5 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2
              id="onboarding-checklist-title"
              className="text-lg font-bold text-slate-900 dark:text-slate-100 sm:text-xl"
            >
              Getting Started Checklist
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Complete these initial steps to set up your MoneyTracker dashboard.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {completedCount} of 3 complete
          </span>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss onboarding checklist"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-5">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={3}
          aria-valuenow={completedCount}
          aria-valuetext={`${completedCount} of 3 steps completed`}
          className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
        >
          <div
            className="h-full rounded-full bg-teal-600 transition-all duration-300 dark:bg-teal-400"
            style={{ width: `${(completedCount / 3) * 100}%` }}
          />
        </div>
      </div>

      <ol className="mt-6 grid grid-cols-1 gap-3.5 md:grid-cols-3">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={`flex flex-col justify-between rounded-2xl border p-5 transition-all ${
              step.completed
                ? "border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                : "border-slate-200/90 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    step.completed
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {step.completed ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </span>
                {step.completed && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Completed
                  </span>
                )}
              </div>

              <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {step.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {step.description}
              </p>
            </div>

            <div className="mt-5 pt-1">
              {step.completed ? (
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <Check className="h-4 w-4" />
                  <span>Completed</span>
                </div>
              ) : (
                <Link
                  to={step.to}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
                  aria-label={`${step.actionText}: ${step.title}`}
                >
                  <span>{step.actionText}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
