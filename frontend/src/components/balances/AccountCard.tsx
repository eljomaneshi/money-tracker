import {
  ChevronDown,
  ChevronUp,
  Landmark,
  Pencil,
  Wallet,
  Coins,
  CreditCard,
} from "lucide-react";
import { Badge, type BadgeVariant } from "../ui/Badge";
import { formatMoney, convertAmount, type ExchangeRates } from "../../utils/formatMoney";

export type Currency = "ALL" | "EUR" | "GBP" | "USD";
export type AccountType = "BANK" | "CASH" | "CRYPTO" | "OTHER";

export type Account = {
  id: number;
  name: string;
  type: AccountType;
  balance: number;
  baseCurrency: Currency;
  sortOrder: number;
};


const getAccountIconAndBadge = (type: AccountType): {
  icon: typeof Wallet;
  variant: BadgeVariant;
  bgClass: string;
} => {
  switch (type) {
    case "BANK":
      return {
        icon: Landmark,
        variant: "info",
        bgClass: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
      };
    case "CASH":
      return {
        icon: Wallet,
        variant: "success",
        bgClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
      };
    case "CRYPTO":
      return {
        icon: Coins,
        variant: "purple",
        bgClass: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
      };
    default:
      return {
        icon: CreditCard,
        variant: "neutral",
        bgClass: "bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300",
      };
  }
};

export interface AccountCardProps {
  account: Account;
  mainCurrency: Currency;
  secondCurrency: Currency;
  showSecondCurrency: boolean;
  rates: ExchangeRates | null;
  onEdit: (account: Account) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function AccountCard({
  account,
  mainCurrency,
  secondCurrency,
  showSecondCurrency,
  rates,
  onEdit,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: AccountCardProps) {
  const { icon: Icon, variant, bgClass } = getAccountIconAndBadge(account.type);

  const convertedMain = rates
    ? convertAmount(account.balance, account.baseCurrency, mainCurrency, rates)
    : 0;

  const convertedSecond =
    rates && showSecondCurrency
      ? convertAmount(account.balance, account.baseCurrency, secondCurrency, rates)
      : 0;

  return (
    <div className="group relative flex flex-col justify-between rounded-[28px] border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#0d1526] sm:p-7">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${bgClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {account.name}
              </h3>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant={variant} className="text-[11px] uppercase tracking-wider">
                  {account.type}
                </Badge>
                <span className="font-mono text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {account.baseCurrency}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={onMoveUp}
                disabled={isFirst}
                title="Move up"
                aria-label={`Move ${account.name} up`}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-20 dark:hover:bg-white/10 dark:hover:text-slate-200"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={isLast}
                title="Move down"
                aria-label={`Move ${account.name} down`}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-20 dark:hover:bg-white/10 dark:hover:text-slate-200"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => onEdit(account)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-white hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <Pencil className="h-3.5 w-3.5 text-amber-500" />
              <span>Edit</span>
            </button>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Account Balance
          </p>
          <p className="mt-1 font-mono text-2xl font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-slate-100 sm:text-3xl">
            {formatMoney(
              account.balance,
              account.baseCurrency,
              account.baseCurrency === "ALL" ? "after" : "before"
            )}
          </p>
        </div>
      </div>

      {(rates && account.baseCurrency !== mainCurrency) ||
      (rates &&
        showSecondCurrency &&
        secondCurrency !== mainCurrency &&
        account.baseCurrency !== secondCurrency) ? (
        <div className="mt-5 border-t border-slate-100 pt-3 dark:border-white/5 space-y-1">
          {rates && account.baseCurrency !== mainCurrency && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 dark:text-slate-500">In {mainCurrency}</span>
              <span className="font-mono font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                {formatMoney(
                  convertedMain,
                  mainCurrency,
                  mainCurrency === "ALL" ? "after" : "before"
                )}
              </span>
            </div>
          )}

          {rates &&
            showSecondCurrency &&
            secondCurrency !== mainCurrency &&
            account.baseCurrency !== secondCurrency && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 dark:text-slate-500">In {secondCurrency}</span>
                <span className="font-mono font-semibold text-teal-600 dark:text-teal-400 tabular-nums">
                  {formatMoney(
                    convertedSecond,
                    secondCurrency,
                    secondCurrency === "ALL" ? "after" : "before"
                  )}
                </span>
              </div>
            )}
        </div>
      ) : null}
    </div>
  );
}

export interface CompactAccountCardProps {
  account: Account;
  mainCurrency: Currency;
  rates: ExchangeRates | null;
  onEdit: (account: Account) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function CompactAccountCard({
  account,
  mainCurrency,
  rates,
  onEdit,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: CompactAccountCardProps) {
  const { icon: Icon, bgClass } = getAccountIconAndBadge(account.type);

  const convertedMain = rates
    ? convertAmount(account.balance, account.baseCurrency, mainCurrency, rates)
    : 0;

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xs dark:border-white/10 dark:bg-[#0d1526]">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${bgClass}`}>
            <Icon className="h-4 w-4" />
          </div>

          <div className="flex items-center gap-1">
            <div className="flex flex-col">
              <button
                type="button"
                onClick={onMoveUp}
                disabled={isFirst}
                className="rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-20 dark:hover:bg-white/10 dark:hover:text-slate-200"
              >
                <ChevronUp className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={isLast}
                className="rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-20 dark:hover:bg-white/10 dark:hover:text-slate-200"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => onEdit(account)}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-amber-500 dark:hover:bg-white/10 dark:hover:text-amber-400"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-3">
          <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
            {account.name}
          </p>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {account.type}
          </p>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-white/5">
        <p className="font-mono text-base font-extrabold text-slate-900 tabular-nums dark:text-slate-100">
          {formatMoney(
            account.balance,
            account.baseCurrency,
            account.baseCurrency === "ALL" ? "after" : "before"
          )}
        </p>

        {rates && account.baseCurrency !== mainCurrency && (
          <p className="mt-0.5 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
            {formatMoney(
              convertedMain,
              mainCurrency,
              mainCurrency === "ALL" ? "after" : "before"
            )}
          </p>
        )}
      </div>
    </div>
  );
}
