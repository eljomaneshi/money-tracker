import React, { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightElement,
      id,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3.5 flex items-center text-slate-400 dark:text-slate-500">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-150 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 dark:bg-[#070b14] dark:text-slate-100 dark:placeholder:text-slate-600 dark:disabled:bg-slate-900 ${
              leftIcon ? "pl-11" : ""
            } ${rightElement ? "pr-11" : ""} ${
              error
                ? "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15 dark:border-rose-600/70 dark:focus:border-rose-500 dark:focus:ring-rose-500/20"
                : "border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
            } ${className}`}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-3 flex items-center">{rightElement}</div>
          )}
        </div>

        {error && (
          <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
