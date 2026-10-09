import { ArrowLeftRight, Landmark, Pencil } from "lucide-react";
import { Badge, type BadgeVariant } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import type { Currency } from "../../utils/formatMoney";

export type AccountActionType = "DEPOSIT" | "WITHDRAWAL" | "TRANSFER_OUT" | "TRANSFER_IN";

export interface InlineAccount {
  id?: number;
  name: string;
  baseCurrency: Currency;
}

export interface ExpenseItem {
  id: number;
  amount: number;
  date: string;
  category: string;
  description?: string | null;
  accountId?: number | null;
  account?: InlineAccount | null;
}

export interface AccountActionItem {
  id: number;
  accountId: number;
  toAccountId?: number | null;
  type: AccountActionType;
  amount: number;
  description?: string | null;
  date: string;
  account?: InlineAccount | null;
  toAccount?: InlineAccount | null;
}

export type ActivityItem =
  | { itemType: "EXPENSE"; data: ExpenseItem }
  | { itemType: "ACCOUNT_ACTION"; data: AccountActionItem };

interface ActivityLedgerTableProps {
  items: ActivityItem[];
  onEditExpense: (expense: ExpenseItem) => void;
  formatExpenseAmount: (exp: ExpenseItem) => string;
  getActivityAmount: (item: ActivityItem) => string;
  getConvertedActivityAmount: (item: ActivityItem) => string | null;
  getAccountName: (accountId?: number | null, inline?: InlineAccount | null) => string;
  getActionLabel: (type: AccountActionType) => string;
}

export function ActivityLedgerTable({
  items,
  onEditExpense,
  formatExpenseAmount,
  getActivityAmount,
  getConvertedActivityAmount,
  getAccountName,
  getActionLabel,
}: ActivityLedgerTableProps) {
  const getBadgeVariant = (item: ActivityItem): BadgeVariant => {
    if (item.itemType === "EXPENSE") {
      return item.data.category === "Subscriptions" ? "purple" : "danger";
    }
    switch (item.data.type) {
      case "DEPOSIT":
        return "success";
      case "WITHDRAWAL":
        return "warning";
      case "TRANSFER_OUT":
      case "TRANSFER_IN":
        return "info";
      default:
        return "neutral";
    }
  };

  const getTypeLabel = (item: ActivityItem): string => {
    if (item.itemType === "EXPENSE") {
      return item.data.category === "Subscriptions" ? "Subscription" : "Expense";
    }
    return getActionLabel(item.data.type);
  };

  return (
    <>
      {/* Desktop Ledger Table */}
      <div className="hidden lg:block">
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/90 bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
                  <th className="py-3.5 pl-6 pr-4">Description</th>
                  <th className="py-3.5 pr-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Type</th>
                  <th className="py-3.5 px-4">Account</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 pl-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {items.map((item) => {
                  const converted = getConvertedActivityAmount(item);
                  const badgeVariant = getBadgeVariant(item);
                  const typeLabel = getTypeLabel(item);

                  if (item.itemType === "EXPENSE") {
                    const exp = item.data;
                    return (
                      <tr
                        key={`expense-${exp.id}`}
                        className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.02]"
                      >
                        {/* Description */}
                        <td className="py-4 pl-6 pr-4">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {exp.description || exp.category}
                          </p>
                          {exp.description && exp.category && (
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              {exp.category}
                            </p>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="py-4 pr-4 text-right">
                          <p className="font-mono text-sm font-extrabold tabular-nums text-rose-600 dark:text-rose-400">
                            {formatExpenseAmount(exp)}
                          </p>
                          {converted && (
                            <p className="font-mono text-xs tabular-nums text-teal-700 dark:text-teal-400">
                              {converted}
                            </p>
                          )}
                        </td>

                        {/* Type */}
                        <td className="py-4 px-4 text-center">
                          <Badge variant={badgeVariant} dot>
                            {typeLabel}
                          </Badge>
                        </td>

                        {/* Account */}
                        <td className="py-4 px-4 text-sm text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Landmark className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{getAccountName(exp.accountId, exp.account)}</span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                          {new Date(exp.date).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td className="py-4 pl-4 pr-6 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onEditExpense(exp)}
                            leftIcon={<Pencil className="h-3 w-3" />}
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    );
                  }

                  const action = item.data;
                  const source = getAccountName(action.accountId, action.account);
                  const target = getAccountName(action.toAccountId, action.toAccount);
                  const isTransfer = action.type === "TRANSFER_OUT" || action.type === "TRANSFER_IN";

                  const amountColor =
                    action.type === "DEPOSIT"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : action.type === "WITHDRAWAL"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-blue-600 dark:text-blue-400";

                  return (
                    <tr
                      key={`action-${action.id}`}
                      className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.02]"
                    >
                      {/* Description */}
                      <td className="py-4 pl-6 pr-4">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {action.description || getActionLabel(action.type)}
                        </p>
                        {action.description && (
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {getActionLabel(action.type)}
                          </p>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-4 pr-4 text-right">
                        <p className={`font-mono text-sm font-extrabold tabular-nums ${amountColor}`}>
                          {action.type === "DEPOSIT" ? "+" : action.type === "WITHDRAWAL" ? "\u2212" : ""}
                          {getActivityAmount(item)}
                        </p>
                        {converted && (
                          <p className="font-mono text-xs tabular-nums text-teal-700 dark:text-teal-400">
                            {converted}
                          </p>
                        )}
                      </td>

                      {/* Type */}
                      <td className="py-4 px-4 text-center">
                        <Badge variant={badgeVariant} dot>
                          {typeLabel}
                        </Badge>
                      </td>

                      {/* Account */}
                      <td className="py-4 px-4 text-sm text-slate-700 dark:text-slate-300">
                        {isTransfer ? (
                          <div className="flex items-center gap-1.5">
                            <ArrowLeftRight className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            <span>{source}</span>
                            <span className="text-slate-400">&rarr;</span>
                            <span>{target}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Landmark className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{source}</span>
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {new Date(action.date).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-4 pl-4 pr-6 text-right font-mono text-xs text-slate-400 dark:text-slate-600">
                        &mdash;
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile Card List */}
      <div className="grid grid-cols-1 gap-3.5 lg:hidden">
        {items.map((item) => {
          const converted = getConvertedActivityAmount(item);
          const badgeVariant = getBadgeVariant(item);
          const typeLabel = getTypeLabel(item);

          if (item.itemType === "EXPENSE") {
            const exp = item.data;
            return (
              <Card key={`expense-mobile-${exp.id}`} padding="sm" className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900 dark:text-slate-100">
                      {exp.description || exp.category}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant={badgeVariant} dot>
                        {typeLabel}
                      </Badge>
                      {exp.description && exp.category && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {exp.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-mono text-base font-extrabold tabular-nums text-rose-600 dark:text-rose-400">
                      {formatExpenseAmount(exp)}
                    </p>
                    {converted && (
                      <p className="font-mono text-xs tabular-nums text-teal-700 dark:text-teal-400">
                        {converted}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500 dark:border-white/5 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <Landmark className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{getAccountName(exp.accountId, exp.account)}</span>
                  </div>
                  <span className="font-mono shrink-0">{new Date(exp.date).toLocaleDateString()}</span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEditExpense(exp)}
                  leftIcon={<Pencil className="h-3.5 w-3.5" />}
                  className="w-full"
                >
                  Edit Expense
                </Button>
              </Card>
            );
          }

          const action = item.data;
          const source = getAccountName(action.accountId, action.account);
          const target = getAccountName(action.toAccountId, action.toAccount);
          const isTransfer = action.type === "TRANSFER_OUT" || action.type === "TRANSFER_IN";

          const amountColor =
            action.type === "DEPOSIT"
              ? "text-emerald-600 dark:text-emerald-400"
              : action.type === "WITHDRAWAL"
              ? "text-amber-600 dark:text-amber-400"
              : "text-blue-600 dark:text-blue-400";

          return (
            <Card key={`action-mobile-${action.id}`} padding="sm" className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900 dark:text-slate-100">
                    {action.description || getActionLabel(action.type)}
                  </p>
                  <div className="mt-1">
                    <Badge variant={badgeVariant} dot>
                      {typeLabel}
                    </Badge>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className={`font-mono text-base font-extrabold tabular-nums ${amountColor}`}>
                    {action.type === "DEPOSIT" ? "+" : action.type === "WITHDRAWAL" ? "\u2212" : ""}
                    {getActivityAmount(item)}
                  </p>
                  {converted && (
                    <p className="font-mono text-xs tabular-nums text-teal-700 dark:text-teal-400">
                      {converted}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500 dark:border-white/5 dark:text-slate-400">
                <div className="flex items-center gap-1.5 truncate">
                  {isTransfer ? (
                    <>
                      <ArrowLeftRight className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">
                        {source} &rarr; {target}
                      </span>
                    </>
                  ) : (
                    <>
                      <Landmark className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{source}</span>
                    </>
                  )}
                </div>
                <span className="font-mono shrink-0">{new Date(action.date).toLocaleDateString()}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
