import React from "react";
import { LayoutGrid, LayoutList, List } from "lucide-react";

export type ViewMode = "comfortable" | "compact" | "list";

export interface ViewSwitcherProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewSwitcher({ viewMode, onChange }: ViewSwitcherProps) {
  const options: { mode: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { mode: "comfortable", label: "Comfortable Grid", icon: LayoutGrid },
    { mode: "compact", label: "Compact Grid", icon: LayoutList },
    { mode: "list", label: "Table List", icon: List },
  ];

  return (
    <div
      role="group"
      aria-label="Account view mode switcher"
      className="inline-flex items-center gap-1 rounded-2xl border border-slate-200/90 bg-white p-1 shadow-xs dark:border-white/10 dark:bg-[#0d1526]"
    >
      {options.map(({ mode, label, icon: Icon }) => {
        const isActive = viewMode === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            title={label}
            aria-label={label}
            aria-pressed={isActive}
            className={`inline-flex items-center justify-center rounded-xl p-2 text-xs font-medium transition-all duration-150 ${
              isActive
                ? "bg-slate-100 text-slate-900 shadow-xs dark:bg-white/10 dark:text-white"
                : "text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-slate-300"
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
