import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Receipt,
  WalletCards,
  Repeat,
  NotebookPen,
  X,
  ChevronRight,
} from "lucide-react";

export interface QuickActionProps {
  variant?: "sidebar" | "compact";
  className?: string;
}

interface ActionOption {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  badge?: string;
  colorClass: string;
}

const actionOptions: ActionOption[] = [
  {
    title: "Log an Expense",
    description: "Record a payment, receipt, or recent purchase",
    icon: Receipt,
    to: "/activity",
    badge: "Expense",
    colorClass: "bg-rose-500/10 text-rose-500 dark:bg-rose-500/15 dark:text-rose-400",
  },
  {
    title: "Add an Account",
    description: "Track a new cash, bank, or savings balance",
    icon: WalletCards,
    to: "/balances",
    badge: "Balance",
    colorClass: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  {
    title: "Track Subscription",
    description: "Keep tabs on a monthly or yearly recurring fee",
    icon: Repeat,
    to: "/subscriptions",
    badge: "Recurring",
    colorClass: "bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
  },
  {
    title: "Write a Note",
    description: "Jot down financial goals, reminders, or budgets",
    icon: NotebookPen,
    to: "/notes",
    badge: "Memo",
    colorClass: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  },
];

export function QuickAction({ variant = "sidebar", className = "" }: QuickActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSelect = (to: string) => {
    setIsOpen(false);
    navigate(to);
  };

  return (
    <>
      {/* Trigger Button */}
      {variant === "sidebar" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label="Quick actions menu"
          className={`group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-4 py-3 text-sm font-bold text-slate-950 shadow-[0_4px_20px_-2px_rgba(16,185,129,0.35)] transition-all duration-200 hover:from-emerald-400 hover:to-emerald-300 hover:shadow-[0_6px_25px_-2px_rgba(16,185,129,0.5)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 ${className}`}
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-slate-950/15 transition-transform group-hover:rotate-90">
            <Plus className="h-4 w-4" />
          </div>
          <span className="tracking-tight">New Entry</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label="Quick actions menu"
          className={`inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-sm transition-all hover:bg-emerald-400 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 ${className}`}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New</span>
        </button>
      )}

      {/* Modal Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-action-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Modal Card */}
          <div
            ref={modalRef}
            className="relative z-10 w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl transition-all duration-200 dark:border-white/10 dark:bg-[#0d1526] text-slate-900 dark:text-slate-100 sm:p-7"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    Quick Action
                  </span>
                </div>
                <h3
                  id="quick-action-title"
                  className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white"
                >
                  Create a new record
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Select what you would like to record in your workspace
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Options List */}
            <div className="mt-4 grid gap-2.5">
              {actionOptions.map((option) => {
                const Icon = option.icon;

                return (
                  <button
                    key={option.title}
                    type="button"
                    onClick={() => handleSelect(option.to)}
                    className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-emerald-500/30 hover:bg-emerald-500/[0.04] hover:shadow-md dark:border-white/5 dark:bg-white/[0.02] dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${option.colorClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {option.title}
                        </span>
                        {option.badge && (
                          <span className="rounded-full bg-slate-200/60 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                            {option.badge}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                        {option.description}
                      </p>
                    </div>

                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-500" />
                  </button>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-white/5 text-center">
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Press <kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 font-mono text-[10px] dark:border-white/10 dark:bg-white/5">Esc</kbd> to dismiss at any time
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default QuickAction;
