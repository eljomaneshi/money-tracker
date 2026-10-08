import React from "react";
import { Skeleton } from "./Skeleton";

export interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  secondaryValue?: string;
  valueColor?: string;
  loading?: boolean;
  error?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg?: string;
  iconColor?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  secondaryValue,
  valueColor = "text-slate-900 dark:text-slate-100",
  loading = false,
  error,
  icon: Icon,
  iconBg = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#0d1526] dark:shadow-none sm:p-7 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
        </div>

        <div className={`rounded-2xl p-2.5 shrink-0 ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {loading ? (
        <div className="mt-4 space-y-2">
          <Skeleton className="h-8 w-32 rounded-xl" />
          <Skeleton className="h-4 w-44 rounded-lg" />
        </div>
      ) : error ? (
        <p className="mt-4 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <p
              className={`text-2xl font-extrabold tracking-tight font-mono sm:text-3xl tabular-nums ${valueColor}`}
            >
              {value}
            </p>
            {secondaryValue && (
              <span className="text-sm font-semibold text-teal-700 dark:text-teal-400 font-mono tabular-nums">
                ({secondaryValue})
              </span>
            )}
          </div>

          {description && (
            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </>
      )}
    </div>
  );
}
