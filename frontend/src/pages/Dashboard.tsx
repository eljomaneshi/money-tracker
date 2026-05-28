import { useEffect, useMemo, useState } from "react";
import {
  ChartPie,
  LayoutDashboard,
  Plus,
  Receipt,
  Repeat,
  Wallet,
  ArrowUpRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { formatMoney } from "../utils/formatMoney";

type Currency = "ALL" | "EUR" | "GBP" | "USD";
type AccountType = "BANK" | "CASH" | "CRYPTO" | "OTHER";
type BillingPeriod = "MONTHLY" | "YEARLY";
type SubscriptionStatus = "ACTIVE" | "CANCELLED";

type Subscription = {
  id: number;
  name: string;
  price: number;
  billingPeriod: BillingPeriod;
  nextBillingDate: string;
  status: SubscriptionStatus;
  accountId?: number | null;
};

type Expense = {
  id: number;
  amount: number;
  date: string;
  category: string;
  description?: string | null;
  accountId?: number | null;
};

type Account = {
  id: number;
  name: string;
  type: AccountType;
  balance: number;
  baseCurrency: Currency;
};

type ExchangeRates = {
  ALL: number;
  EUR: number;
  GBP: number;
  USD: number;
};

type UserSettings = {
  email: string;
  fullName: string | null;
  totalsMainCurrency: Currency;
  showSecondCurrency: boolean;
  secondCurrency: Currency | null;
  notifySubscriptionReminder: boolean;
  notifySubscriptionCreated: boolean;
  notifySubscriptionCancelled: boolean;
};

const convertAmount = (
  amount: number,
  from: Currency,
  to: Currency,
  rates: ExchangeRates
) => {
  if (from === to) return amount;

  const fromRate = from === "EUR" ? 1 : rates[from];
  const toRate = to === "EUR" ? 1 : rates[to];

  if (
    !Number.isFinite(amount) ||
    !Number.isFinite(fromRate) ||
    !Number.isFinite(toRate) ||
    fromRate <= 0 ||
    toRate <= 0
  ) {
    return 0;
  }

  const amountInEur = from === "EUR" ? amount : amount / fromRate;
  return to === "EUR" ? amountInEur : amountInEur * toRate;
};

function StatCard({
  title,
  value,
  description,
  valueColor = "text-slate-900 dark:text-slate-100",
  loading,
  error,
  icon: Icon,
  iconWrapperClassName,
}: {
  title: string;
  value: string;
  description: string;
  valueColor?: string;
  loading: boolean;
  error: string;
  icon: React.ComponentType<{ className?: string }>;
  iconWrapperClassName: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/6 dark:bg-[#0f1b3d] sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {title}
          </p>
        </div>

        <div className={`rounded-2xl p-2.5 ${iconWrapperClassName}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">Loading...</p>
      ) : error ? (
        <p className="mt-4 text-sm text-red-700 dark:text-red-400">{error}</p>
      ) : (
        <>
          <p className={`mt-4 text-3xl font-extrabold sm:text-4xl ${valueColor}`}>
            {value}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [topCategory, setTopCategory] = useState("No expenses yet");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const [subsRes, expensesRes, accountsRes, ratesRes, settingsRes] =
          await Promise.all([
            api.get("/subscriptions"),
            api.get("/expenses"),
            api.get("/accounts"),
            api.get("/accounts/exchange-rates"),
            api.get("/users/me/settings"),
          ]);

        setSubscriptions(subsRes.data.subscriptions || []);
        setExpenses(expensesRes.data.expenses || []);
        setAccounts(accountsRes.data.accounts || []);
        setRates(ratesRes.data.rates || null);
        setSettings(settingsRes.data || null);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.error || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getAccountCurrency = (accountId?: number | null): Currency => {
    if (!accountId) return "EUR";
    const account = accounts.find((acc) => acc.id === accountId);
    return account?.baseCurrency || "EUR";
  };

  const mainCurrency: Currency = settings?.totalsMainCurrency || "ALL";
  const showSecondCurrency = settings?.showSecondCurrency ?? true;
  const secondCurrency: Currency =
    settings?.secondCurrency && settings.secondCurrency !== mainCurrency
      ? settings.secondCurrency
      : mainCurrency === "ALL"
      ? "EUR"
      : "ALL";

  const totalBalanceMain = useMemo(() => {
    if (!rates) return 0;

    return accounts.reduce(
      (sum, acc) =>
        sum + convertAmount(acc.balance, acc.baseCurrency, mainCurrency, rates),
      0
    );
  }, [accounts, rates, mainCurrency]);

  const totalBalanceSecond = useMemo(() => {
    if (!rates || !showSecondCurrency) return 0;

    return accounts.reduce(
      (sum, acc) =>
        sum + convertAmount(acc.balance, acc.baseCurrency, secondCurrency, rates),
      0
    );
  }, [accounts, rates, secondCurrency, showSecondCurrency]);

  const monthlySubscriptionsMain = useMemo(() => {
    if (!rates) return 0;

    return subscriptions
      .filter((sub) => sub.status === "ACTIVE")
      .reduce((sum, sub) => {
        const sourceCurrency = getAccountCurrency(sub.accountId);
        const monthlyAmount =
          sub.billingPeriod === "MONTHLY" ? sub.price : sub.price / 12;

        return sum + convertAmount(monthlyAmount, sourceCurrency, mainCurrency, rates);
      }, 0);
  }, [subscriptions, accounts, rates, mainCurrency]);

  const yearlySubscriptionsMain = useMemo(() => {
    return monthlySubscriptionsMain * 12;
  }, [monthlySubscriptionsMain]);

  const expensesThisMonthMain = useMemo(() => {
    if (!rates) return 0;

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return expenses
      .filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= firstDayOfMonth && expenseDate <= now;
      })
      .reduce((sum, expense) => {
        const sourceCurrency = getAccountCurrency(expense.accountId);
        return sum + convertAmount(expense.amount, sourceCurrency, mainCurrency, rates);
      }, 0);
  }, [expenses, accounts, rates, mainCurrency]);

  useEffect(() => {
    if (!rates) {
      setTopCategory("No expenses yet");
      return;
    }

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const currentMonthExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= firstDayOfMonth && expenseDate <= now;
    });

    if (currentMonthExpenses.length === 0) {
      setTopCategory("No expenses yet");
      return;
    }

    const categoryTotals = currentMonthExpenses.reduce<Record<string, number>>(
      (acc, expense) => {
        const sourceCurrency = getAccountCurrency(expense.accountId);
        const converted = convertAmount(
          expense.amount,
          sourceCurrency,
          mainCurrency,
          rates
        );

        acc[expense.category] = (acc[expense.category] || 0) + converted;
        return acc;
      },
      {}
    );

    let highestCategory = "No expenses yet";
    let highestAmount = 0;

    for (const [category, amount] of Object.entries(categoryTotals)) {
      if (amount > highestAmount) {
        highestAmount = amount;
        highestCategory = category;
      }
    }

    setTopCategory(highestCategory);
  }, [expenses, accounts, rates, mainCurrency]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col items-start gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
              Dashboard
            </h1>
          </div>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
            A quick overview of your balances, subscriptions, and monthly spending.
          </p>
        </div>

        <div className="flex w-full justify-center sm:justify-start">
          <Link
            to="/activity"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Plus className="h-4 w-4" />
            </span>
            <span>Add expense</span>
            <ArrowUpRight className="h-4 w-4 opacity-60" />
          </Link>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/6 dark:bg-[#0f1b3d] sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-teal-100 p-2.5 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Total balance
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">
                  Balance
                </h2>
              </div>
            </div>

            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
              Total across all your accounts
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">Loading...</p>
          ) : error ? (
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          ) : (
            <div className="flex flex-col items-start gap-2 md:items-end">
              <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-4xl">
                {formatMoney(
                  totalBalanceMain,
                  mainCurrency,
                  mainCurrency === "ALL" ? "after" : "before"
                )}
              </p>

              {showSecondCurrency && (
                <p className="text-xl font-bold text-teal-700 dark:text-teal-400 sm:text-3xl">
                  {formatMoney(
                    totalBalanceSecond,
                    secondCurrency,
                    secondCurrency === "ALL" ? "after" : "before"
                  )}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Subscription Overview"
          value={formatMoney(
            monthlySubscriptionsMain,
            mainCurrency,
            mainCurrency === "ALL" ? "after" : "before"
          )}
          description={`Per month • ${formatMoney(
            yearlySubscriptionsMain,
            mainCurrency,
            mainCurrency === "ALL" ? "after" : "before"
          )} per year`}
          valueColor="text-blue-700 dark:text-blue-400"
          loading={loading}
          error={error}
          icon={Repeat}
          iconWrapperClassName="bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"
        />

        <StatCard
          title="Expenses This Month"
          value={formatMoney(
            expensesThisMonthMain,
            mainCurrency,
            mainCurrency === "ALL" ? "after" : "before"
          )}
          description="Total spending this month"
          valueColor="text-rose-600 dark:text-rose-400"
          loading={loading}
          error={error}
          icon={Receipt}
          iconWrapperClassName="bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300"
        />

        <StatCard
          title="Most Spent"
          value={topCategory}
          description="Top category this month"
          valueColor="text-slate-900 dark:text-slate-100"
          loading={loading}
          error={error}
          icon={ChartPie}
          iconWrapperClassName="bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
        />
      </section>
    </div>
  );
}