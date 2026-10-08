import React from "react";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

const paddingStyles = {
  none: "",
  sm: "p-4 sm:p-5",
  md: "p-6 sm:p-8",
  lg: "p-8 sm:p-10",
};

export function GlassCard({
  padding = "md",
  hover = false,
  className = "",
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={`rounded-3xl border border-slate-200/70 bg-white/75 backdrop-blur-md shadow-sm transition-all duration-200 dark:border-white/10 dark:bg-[#0d1526]/75 dark:shadow-none ${
        hover
          ? "hover:-translate-y-0.5 hover:shadow-md hover:bg-white/90 dark:hover:bg-[#111a30]/85 dark:hover:border-white/20"
          : ""
      } ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
