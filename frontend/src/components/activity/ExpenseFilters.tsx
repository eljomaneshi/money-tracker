import {
  ArrowLeftRight,
  Calendar,
  Download,
  Filter,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { formatMoney, type Currency } from "../../utils/formatMoney";
import { Button, Card, Select } from "../ui";

export interface AccountOption {
  id: number;
  name: string;
  baseCurrency: Currency;
}

export interface TotalsData {
  expenses: number;
  deposits: number;
  withdrawals: number;
  transfersOut: number;
}

export const DATE_PRESETS = [
  { key: "", label: "All time" },
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "this_month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "custom", label: "Custom range" },
];

export const TYPE_OPTIONS = [
  { key: "EXPENSE", label: "Expenses", dot: "bg-rose-500", activeClass: "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800/50 dark:text-rose-300" },
  { key: "SUBSCRIPTION", label: "Subscriptions", dot: "bg-violet-500", activeClass: "bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-950/40 dark:border-violet-800/50 dark:text-violet-300" },
  { key: "DEPOSIT", label: "Deposits", dot: "bg-emerald-500", activeClass: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800/50 dark:text-emerald-300" },
  { key: "WITHDRAWAL", label: "Withdrawals", dot: "bg-amber-500", activeClass: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800/50 dark:text-amber-300" },
  { key: "TRANSFER_OUT", label: "Transfers out", dot: "bg-blue-500", activeClass: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800/50 dark:text-blue-300" },
  { key: "TRANSFER_IN", label: "Transfers in", dot: "bg-cyan-500", activeClass: "bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-950/40 dark:border-cyan-800/50 dark:text-cyan-300" },
];

interface ExpenseFiltersProps {
  categoryFilter: string;
  onCategoryFilterChange: (val: string) => void;
  categoryOptions: string[];
  paidFromFilter: string;
  onPaidFromFilterChange: (val: string) => void;
  accounts: AccountOption[];
  datePreset: string;
  onDatePresetChange: (key: string) => void;
  dateFrom: string;
  onDateFromChange: (val: string) => void;
  dateTo: string;
  onDateToChange: (val: string) => void;
  selectedTypes: string[];
  onToggleType: (key: string) => void;
  activeFilterCount: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  filteredCount: number;
  totalCount: number;
  onExportPdf: () => void;
  isExportingPdf?: boolean;
  totals?: TotalsData | null;
  netCashflow?: number;
  mainCurrency: Currency;
}

export function ExpenseFilters({
  categoryFilter,
  onCategoryFilterChange,
  categoryOptions,
  paidFromFilter,
  onPaidFromFilterChange,
  accounts,
  datePreset,
  onDatePresetChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  selectedTypes,
  onToggleType,
  activeFilterCount,
  hasActiveFilters,
  onClearFilters,
  filteredCount,
  totalCount,
  onExportPdf,
  isExportingPdf = false,
  totals,
  netCashflow = 0,
  mainCurrency,
}: ExpenseFiltersProps) {
  const pos = mainCurrency === "ALL" ? "after" : "before";

  return (
    <Card padding="md" className="space-y-6">
      {/* Header with Active Filters Badge & Clear Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-slate-100 p-2 text-slate-700 dark:bg-white/5 dark:text-slate-300">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Filter Ledger</span>
            {activeFilterCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                {activeFilterCount} active
              </span>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 transition hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
          >
            <X className="h-3.5 w-3.5" />
            Reset all filters
          </button>
        )}
      </div>

      {/* Main Selects: Category and Account */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select
          label="Category"
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
        >
          <option value="">All categories</option>
          {categoryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>

        <Select
          label="Account"
          value={paidFromFilter}
          onChange={(e) => onPaidFromFilterChange(e.target.value)}
        >
          <option value="">All accounts</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={String(acc.id)}>
              {acc.name} ({acc.baseCurrency})
            </option>
          ))}
        </Select>
      </div>

      {/* Date Presets Section */}
      <div>
        <div className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Calendar className="h-3.5 w-3.5" />
          <span>Date Range</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {DATE_PRESETS.map(({ key, label }) => {
            const isSelected = datePreset === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onDatePresetChange(key)}
                className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all select-none cursor-pointer ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-sm dark:border-emerald-500 dark:bg-emerald-500 dark:text-slate-950"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-[#070b14] dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/5"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {datePreset === "custom" && (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-[#070b14] dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => onDateToChange(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-[#070b14] dark:text-slate-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Activity Type Chips */}
      <div>
        <div className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Wallet className="h-3.5 w-3.5" />
          <span>Activity Type</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map(({ key, label, dot, activeClass }) => {
            const isSelected = selectedTypes.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => onToggleType(key)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all select-none cursor-pointer ${
                  isSelected
                    ? `${activeClass} shadow-xs`
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-[#070b14] dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/5"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Totals Telemetry Banner */}
      {totals && (
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-[#070b14]/70">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Expenses</span>
              </div>
              <p className="font-mono text-base font-extrabold tracking-tight tabular-nums text-rose-600 dark:text-rose-400">
                {formatMoney(totals.expenses, mainCurrency, pos)}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Deposits</span>
              </div>
              <p className="font-mono text-base font-extrabold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatMoney(totals.deposits, mainCurrency, pos)}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Wallet className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Net Cashflow</span>
              </div>
              <p
                className={`font-mono text-base font-extrabold tracking-tight tabular-nums ${
                  netCashflow >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {netCashflow >= 0 ? "+" : "\u2212"}
                {formatMoney(Math.abs(netCashflow), mainCurrency, pos)}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">excl. transfers</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <ArrowLeftRight className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Transfers</span>
              </div>
              <p className="font-mono text-base font-extrabold tracking-tight tabular-nums text-blue-600 dark:text-blue-400">
                {formatMoney(totals.transfersOut, mainCurrency, pos)}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">between accounts</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer: Ledger counts & PDF export */}
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 dark:border-white/5">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Showing{" "}
          <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {filteredCount}
          </span>{" "}
          of{" "}
          <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {totalCount}
          </span>{" "}
          activity items
        </p>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              leftIcon={<X className="h-3.5 w-3.5" />}
            >
              Clear filters
            </Button>
          )}

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onExportPdf}
            isLoading={isExportingPdf}
            leftIcon={<Download className="h-3.5 w-3.5" />}
          >
            Export PDF
          </Button>
        </div>
      </div>
    </Card>
  );
}
