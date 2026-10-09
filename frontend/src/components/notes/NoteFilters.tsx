import { Search, X } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

export interface NoteFilterCounts {
  total: number;
  open: number;
  done: number;
  cancelled: number;
  general: number;
  toReceive: number;
  toPay: number;
  reminder: number;
}

export interface NoteFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  typeFilter: string;
  onTypeChange: (type: string) => void;
  counts: NoteFilterCounts;
  onReset: () => void;
}

export function NoteFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  counts,
  onReset,
}: NoteFiltersProps) {
  const isFiltered = Boolean(searchQuery || statusFilter || typeFilter);

  const statusChips = [
    { id: "", label: "All Statuses", count: counts.total },
    { id: "OPEN", label: "Open", count: counts.open },
    { id: "DONE", label: "Done", count: counts.done },
    { id: "CANCELLED", label: "Cancelled", count: counts.cancelled },
  ];

  const typeChips = [
    { id: "", label: "All Types", count: counts.total },
    { id: "GENERAL", label: "General", count: counts.general },
    { id: "TO_RECEIVE", label: "To Receive", count: counts.toReceive },
    { id: "TO_PAY", label: "To Pay", count: counts.toPay },
    { id: "REMINDER", label: "Reminders", count: counts.reminder },
  ];

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0d1526] sm:p-6">
      {/* Search Bar + Reset */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes by title, person, or description..."
            leftIcon={<Search className="h-4 w-4" />}
            rightElement={
              searchQuery ? (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : undefined
            }
          />
        </div>

        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            leftIcon={<X className="h-3.5 w-3.5" />}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Filter Chips Rows */}
      <div className="flex flex-col gap-3 pt-1 border-t border-slate-100 dark:border-white/5 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Status:
          </span>
          {statusChips.map((chip) => {
            const isActive = statusFilter === chip.id;
            return (
              <button
                key={`status-${chip.id || "all"}`}
                type="button"
                onClick={() => onStatusChange(chip.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm dark:bg-emerald-500 dark:text-slate-950"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <span>{chip.label}</span>
                <span
                  className={`rounded-md px-1.5 py-0.2 text-[10px] font-mono tabular-nums ${
                    isActive
                      ? "bg-white/20 text-white dark:bg-slate-950/20 dark:text-slate-950"
                      : "bg-slate-200/80 text-slate-700 dark:bg-slate-700/60 dark:text-slate-300"
                  }`}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Type Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Type:
          </span>
          {typeChips.map((chip) => {
            const isActive = typeFilter === chip.id;
            return (
              <button
                key={`type-${chip.id || "all"}`}
                type="button"
                onClick={() => onTypeChange(chip.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm dark:bg-emerald-500 dark:text-slate-950"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <span>{chip.label}</span>
                <span
                  className={`rounded-md px-1.5 py-0.2 text-[10px] font-mono tabular-nums ${
                    isActive
                      ? "bg-white/20 text-white dark:bg-slate-950/20 dark:text-slate-950"
                      : "bg-slate-200/80 text-slate-700 dark:bg-slate-700/60 dark:text-slate-300"
                  }`}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
