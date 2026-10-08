import React from "react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  iconBg?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  actionIcon,
  iconBg = "bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300",
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center transition-colors dark:border-white/10 dark:bg-[#070b14]/50 sm:p-12 ${className}`}
    >
      <div className={`mx-auto mb-4 inline-flex rounded-2xl p-3.5 ${iconBg}`}>
        <Icon className="h-6 w-6" />
      </div>

      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 sm:text-lg">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {description}
      </p>

      {actionText && onAction && (
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onAction}
            leftIcon={actionIcon}
          >
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}
