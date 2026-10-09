import { useMemo } from "react";
import { Calendar, CheckCircle2, Clock, CreditCard, Repeat } from "lucide-react";
import { formatMoney, convertAmount, type Currency, type ExchangeRates } from "../../utils/formatMoney";
import { StatCard } from "../ui/StatCard";

export interface UpcomingSub {
  name: string;
  date: Date;
  amount: string;
}

export interface SubscriptionItem {
  id: number;
  name: string;
  price: number;
  billingPeriod: "MONTHLY" | "YEARLY";
  nextBillingDate: string;
  status: "ACTIVE" | "CANCELLED";
  accountId?: number | null;
}

export interface AccountItem {
  id: number;
  name: string;
  baseCurrency: Currency;
}

interface RenewalTimelineProps {
  subscriptions: SubscriptionItem[];
  accounts: AccountItem[];
  rates: ExchangeRates | null;
  mainCurrency: Currency;
  secondCurrency: Currency;
  showSecondCurrency: boolean;
  loading?: boolean;
}

export function RenewalTimeline({
  subscriptions,
  accounts,
  rates,
  mainCurrency,
  secondCurrency,
  showSecondCurrency,
  loading = false,
}: RenewalTimelineProps) {
  const pos = mainCurrency === "ALL" ? "after" : "before";
  const posSecond = secondCurrency === "ALL" ? "after" : "before";

  const getAccountCurrency = (accountId?: number | null): Currency => {
    if (!accountId) return "EUR";
    const acc = accounts.find((a) => a.id === accountId);
    return acc?.baseCurrency || "EUR";
  };

  const metrics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);
    const in30Days = new Date(today);
    in30Days.setDate(in30Days.getDate() + 30);

    const active = subscriptions.filter((s) => s.status === "ACTIVE");

    let monthlyTotalMain = 0;
    let monthlyTotalSecond = 0;
    let dueIn7DaysCount = 0;
    let dueIn7DaysTotal = 0;
    let dueIn30DaysCount = 0;
    let dueIn30DaysTotal = 0;

    let nextUpcomingSub: UpcomingSub | null = null;
    let minUpcomingTime = Infinity;

    for (const sub of active) {
      const accCurr = getAccountCurrency(sub.accountId);
      const monthlyPrice = sub.billingPeriod === "YEARLY" ? sub.price / 12 : sub.price;

      if (rates) {
        monthlyTotalMain += convertAmount(monthlyPrice, accCurr, mainCurrency, rates);
        if (showSecondCurrency) {
          monthlyTotalSecond += convertAmount(monthlyPrice, accCurr, secondCurrency, rates);
        }
      }

      const billDate = new Date(sub.nextBillingDate);
      if (!Number.isNaN(billDate.getTime())) {
        const billTime = billDate.getTime();
        if (billDate >= today && billDate <= in7Days) {
          dueIn7DaysCount++;
          if (rates) {
            dueIn7DaysTotal += convertAmount(sub.price, accCurr, mainCurrency, rates);
          }
        }
        if (billDate >= today && billDate <= in30Days) {
          dueIn30DaysCount++;
          if (rates) {
            dueIn30DaysTotal += convertAmount(sub.price, accCurr, mainCurrency, rates);
          }
        }

        if (billTime >= today.getTime() && billTime < minUpcomingTime) {
          minUpcomingTime = billTime;
          nextUpcomingSub = {
            name: sub.name,
            date: billDate,
            amount: formatMoney(sub.price, accCurr, accCurr === "ALL" ? "after" : "before"),
          };
        }
      }
    }

    return {
      activeCount: active.length,
      totalCount: subscriptions.length,
      monthlyTotalMain,
      monthlyTotalSecond,
      dueIn7DaysCount,
      dueIn7DaysTotal,
      dueIn30DaysCount,
      dueIn30DaysTotal,
      nextUpcomingSub,
    };
  }, [subscriptions, accounts, rates, mainCurrency, secondCurrency, showSecondCurrency]);

  const secondaryCommitment =
    showSecondCurrency && rates && metrics.monthlyTotalSecond > 0
      ? formatMoney(metrics.monthlyTotalSecond, secondCurrency, posSecond)
      : undefined;

  const nextSub = metrics.nextUpcomingSub;

  return (
    <div className="space-y-4">
      {/* 4 Telemetry StatCards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Monthly Outflow Commitment */}
        <StatCard
          title="Monthly Outflow"
          value={formatMoney(metrics.monthlyTotalMain, mainCurrency, pos)}
          secondaryValue={secondaryCommitment}
          description="Normalized recurring commitment"
          icon={Repeat}
          iconBg="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
          valueColor="text-emerald-600 dark:text-emerald-400"
          loading={loading}
        />

        {/* Due Next 7 Days */}
        <StatCard
          title="Renewing in 7 Days"
          value={String(metrics.dueIn7DaysCount)}
          secondaryValue={
            metrics.dueIn7DaysTotal > 0
              ? formatMoney(metrics.dueIn7DaysTotal, mainCurrency, pos)
              : undefined
          }
          description="Immediate upcoming renewals"
          icon={Clock}
          iconBg="bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
          valueColor="text-amber-600 dark:text-amber-400"
          loading={loading}
        />

        {/* Due Next 30 Days */}
        <StatCard
          title="Renewing in 30 Days"
          value={String(metrics.dueIn30DaysCount)}
          secondaryValue={
            metrics.dueIn30DaysTotal > 0
              ? formatMoney(metrics.dueIn30DaysTotal, mainCurrency, pos)
              : undefined
          }
          description="Expected renewals this month"
          icon={Calendar}
          iconBg="bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
          valueColor="text-blue-600 dark:text-blue-400"
          loading={loading}
        />

        {/* Active vs Total Tracked */}
        <StatCard
          title="Active Services"
          value={`${metrics.activeCount} / ${metrics.totalCount}`}
          description={`${metrics.totalCount - metrics.activeCount} cancelled`}
          icon={CheckCircle2}
          iconBg="bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
          valueColor="text-violet-600 dark:text-violet-400"
          loading={loading}
        />
      </div>

      {/* Immediate Next Renewal Pill */}
      {nextSub && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-600 dark:border-white/10 dark:bg-[#070b14]/70 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>
              Next renewal:{" "}
              <strong className="font-semibold text-slate-900 dark:text-slate-100">
                {nextSub.name}
              </strong>{" "}
              ({nextSub.amount})
            </span>
          </div>
          <span className="font-mono text-slate-500 dark:text-slate-400">
            {nextSub.date.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      )}
    </div>
  );
}
