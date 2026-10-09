import type { ComponentType, ReactNode } from "react";

export interface SettingsSectionProps {
  icon: ComponentType<{ className?: string }>;
  iconBg?: string;
  title: string;
  description?: string;
  badge?: ReactNode;
  successMessage?: string;
  errorMessage?: string;
  children: ReactNode;
  className?: string;
  danger?: boolean;
}

export function SettingsSection({
  icon: Icon,
  iconBg = "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300",
  title,
  description,
  badge,
  successMessage,
  errorMessage,
  children,
  className = "",
  danger = false,
}: SettingsSectionProps) {
  return (
    <section
      className={`rounded-3xl border bg-white p-6 shadow-sm transition-all duration-200 dark:bg-[#0d1526] sm:p-8 ${
        danger
          ? "border-rose-200/80 dark:border-rose-900/40"
          : "border-slate-200/90 dark:border-white/10"
      } ${className}`}
    >
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className={`rounded-2xl p-2.5 shrink-0 ${iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2
                className={`text-xl font-bold tracking-tight sm:text-2xl ${
                  danger
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-slate-900 dark:text-slate-100"
                }`}
              >
                {title}
              </h2>
              {badge}
            </div>
            {description && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          {successMessage}
        </div>
      )}

      {/* Error Notification Alert */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
        >
          {errorMessage}
        </div>
      )}

      {/* Section Content */}
      <div className="space-y-6">{children}</div>
    </section>
  );
}
