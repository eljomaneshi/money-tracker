import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "rounded" | "circular" | "rectangular";
}

export function Skeleton({
  variant = "rounded",
  className = "",
  ...props
}: SkeletonProps) {
  const variantClass =
    variant === "circular"
      ? "rounded-full"
      : variant === "rectangular"
      ? "rounded-none"
      : "rounded-2xl";

  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-slate-200/90 dark:bg-slate-800/80 ${variantClass} ${className}`}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2.5 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? "w-2/3" : "w-full"} rounded-lg`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0d1526] ${className}`}
    >
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-28 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-2xl" />
      </div>
      <Skeleton className="mt-5 h-8 w-36 rounded-xl" />
      <Skeleton className="mt-3 h-4 w-48 rounded-lg" />
    </div>
  );
}
