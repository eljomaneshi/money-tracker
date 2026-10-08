import React from "react";

export type BadgeVariant =
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "neutral"
  | "purple"
  | "currency";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  success:
    "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40",
  danger:
    "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40",
  warning:
    "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40",
  info:
    "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40",
  neutral:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/60",
  purple:
    "bg-violet-50 text-violet-700 border-violet-200/80 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/40",
  currency:
    "bg-teal-50 text-teal-700 border-teal-200/80 font-mono tracking-wider dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/40",
};

const dotColors: Record<BadgeVariant, string> = {
  success: "bg-emerald-500",
  danger: "bg-rose-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
  neutral: "bg-slate-400",
  purple: "bg-violet-500",
  currency: "bg-teal-500",
};

export function Badge({
  variant = "neutral",
  dot = false,
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold select-none transition-colors ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}
