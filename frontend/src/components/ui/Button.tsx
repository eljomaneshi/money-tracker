import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm hover:shadow-emerald-500/20 active:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 dark:active:bg-emerald-600",
  secondary:
    "bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-200 dark:hover:text-white border border-transparent dark:border-slate-700/50",
  outline:
    "bg-transparent hover:bg-slate-100 text-slate-700 border border-slate-300 dark:border-slate-700/80 dark:text-slate-200 dark:hover:bg-slate-800/60 dark:hover:border-slate-600",
  ghost:
    "bg-transparent hover:bg-slate-100 text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200",
  danger:
    "bg-rose-600 hover:bg-rose-500 text-white shadow-sm hover:shadow-rose-500/20 active:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-xl gap-1.5",
  md: "px-4 py-2.5 text-sm rounded-2xl gap-2",
  lg: "px-5 py-3 text-base rounded-2xl gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center font-semibold tracking-[0.01em] transition-all duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
