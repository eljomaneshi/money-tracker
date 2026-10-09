import { AlertCircle, Calendar, Landmark, Repeat, XCircle } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import type { SubscriptionItem, AccountItem } from "./RenewalTimeline";
import { formatMoney, convertAmount, type Currency, type ExchangeRates } from "../../utils/formatMoney";

interface SubscriptionCardProps {
  subscription: SubscriptionItem;
  accounts: AccountItem[];
  rates: ExchangeRates | null;
  secondCurrency: Currency;
  showSecondCurrency: boolean;
  onCancel: (id: number) => void;
  isCancelling?: boolean;
}

export function SubscriptionCard({
  subscription,
  accounts,
  rates,
  secondCurrency,
  showSecondCurrency,
  onCancel,
  isCancelling = false,
}: SubscriptionCardProps) {
  const account = accounts.find((a) => a.id === subscription.accountId);
  const accountName = account?.name || "No linked account";
  const currency: Currency = account?.baseCurrency || "EUR";
  const pos = currency === "ALL" ? "after" : "before";
  const posSecond = secondCurrency === "ALL" ? "after" : "before";

  const primaryFormatted = formatMoney(subscription.price, currency, pos);

  const convertedFormatted =
    showSecondCurrency && rates && currency !== secondCurrency
      ? formatMoney(
          convertAmount(subscription.price, currency, secondCurrency, rates),
          secondCurrency,
          posSecond
        )
      : null;

  const nextDate = new Date(subscription.nextBillingDate);
  const isValidDate = !Number.isNaN(nextDate.getTime());
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);
  const isDueSoon = subscription.status === "ACTIVE" && isValidDate && nextDate >= today && nextDate <= in7Days;

  return (
    <>
      {/* Desktop Ledger Row (Hidden on mobile) */}
      <tr className="hidden lg:table-row group transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
        {/* Name & Period */}
        <td className="py-4 pl-6 pr-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-500/10 p-2 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400 shrink-0">
              <Repeat className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {subscription.name}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {subscription.billingPeriod === "MONTHLY" ? "Billed Monthly" : "Billed Yearly"}
                </span>
                {isDueSoon && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-3 w-3" />
                    Due soon
                  </span>
                )}
              </div>
            </div>
          </div>
        </td>

        {/* Amount */}
        <td className="py-4 pr-4 text-right">
          <p className="font-mono text-sm font-extrabold tabular-nums text-slate-900 dark:text-slate-100">
            {primaryFormatted}
          </p>
          {convertedFormatted && (
            <p className="font-mono text-xs tabular-nums text-teal-700 dark:text-teal-400">
              {convertedFormatted}
            </p>
          )}
        </td>

        {/* Status Badge */}
        <td className="py-4 px-4 text-center">
          <Badge
            variant={subscription.status === "ACTIVE" ? "success" : "neutral"}
            dot
          >
            {subscription.status === "ACTIVE" ? "Active" : "Cancelled"}
          </Badge>
        </td>

        {/* Account */}
        <td className="py-4 px-4 text-sm text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <Landmark className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{accountName}</span>
          </div>
        </td>

        {/* Next Billing Date */}
        <td className="py-4 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
            <span>{isValidDate ? nextDate.toLocaleDateString() : "—"}</span>
          </div>
        </td>

        {/* Action */}
        <td className="py-4 pl-4 pr-6 text-right">
          {subscription.status === "ACTIVE" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onCancel(subscription.id)}
              isLoading={isCancelling}
              leftIcon={<XCircle className="h-3 w-3" />}
              className="text-rose-600 hover:text-rose-700 hover:border-rose-300 dark:text-rose-400 dark:hover:text-rose-300"
            >
              Cancel
            </Button>
          ) : (
            <span className="font-mono text-xs text-slate-400 dark:text-slate-600">&mdash;</span>
          )}
        </td>
      </tr>

      {/* Mobile Card Layout (Hidden on desktop) */}
      <div className="block lg:hidden">
        <Card padding="sm" className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="rounded-xl bg-violet-500/10 p-2 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400 shrink-0">
                <Repeat className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-900 dark:text-slate-100">
                  {subscription.name}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant={subscription.status === "ACTIVE" ? "success" : "neutral"}
                    dot
                  >
                    {subscription.status === "ACTIVE" ? "Active" : "Cancelled"}
                  </Badge>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {subscription.billingPeriod === "MONTHLY" ? "Monthly" : "Yearly"}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="font-mono text-base font-extrabold tabular-nums text-slate-900 dark:text-slate-100">
                {primaryFormatted}
              </p>
              {convertedFormatted && (
                <p className="font-mono text-xs tabular-nums text-teal-700 dark:text-teal-400">
                  {convertedFormatted}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500 dark:border-white/5 dark:text-slate-400">
            <div className="flex items-center gap-1.5 truncate">
              <Landmark className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{accountName}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 font-mono">
              <Calendar className="h-3 w-3 text-slate-400" />
              <span>{isValidDate ? nextDate.toLocaleDateString() : "—"}</span>
            </div>
          </div>

          {subscription.status === "ACTIVE" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onCancel(subscription.id)}
              isLoading={isCancelling}
              leftIcon={<XCircle className="h-3.5 w-3.5" />}
              className="w-full text-rose-600 hover:text-rose-700 hover:border-rose-300 dark:text-rose-400 dark:hover:text-rose-300"
            >
              Cancel Subscription
            </Button>
          )}
        </Card>
      </div>
    </>
  );
}
