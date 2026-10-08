import React, { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      children,
      id,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={`w-full appearance-none rounded-2xl border bg-white px-4 py-3 pr-10 text-sm text-slate-900 outline-none transition-all duration-150 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 dark:bg-[#070b14] dark:text-slate-100 dark:disabled:bg-slate-900 ${
              error
                ? "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15 dark:border-rose-600/70 dark:focus:border-rose-500 dark:focus:ring-rose-500/20"
                : "border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
            } ${className}`}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <div className="pointer-events-none absolute right-3.5 flex items-center text-slate-400 dark:text-slate-500">
            <ChevronDown className="h-4 w-4" />
          </div>
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

Select.displayName = "Select";
