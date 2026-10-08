import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

const paddingStyles = {
  none: "",
  sm: "p-4 sm:p-5",
  md: "p-6 sm:p-8",
  lg: "p-8 sm:p-10",
};

export function Card({
  padding = "md",
  hover = false,
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-3xl border border-slate-200/90 bg-white shadow-sm transition-all duration-200 dark:border-white/10 dark:bg-[#0d1526] dark:shadow-none ${
        hover
          ? "hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 dark:hover:bg-[#111a30]"
          : ""
      } ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
