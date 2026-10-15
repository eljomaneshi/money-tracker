import React, { useEffect, useState } from "react";
import { Pencil, Save, Trash2, X } from "lucide-react";
import { Button, Dialog, Input, Select } from "../ui";
import type { AccountOption } from "./ExpenseFilters";
import {
  parseDateAndTimeToInputs,
  constructIsoDateTime,
  getTodayDateStr,
  getCurrentTimeStr,
} from "../../utils/dateTime";

export interface ExpenseRecord {
  id: number;
  amount: number;
  date: string;
  category: string;
  description?: string | null;
  accountId?: number | null;
}

interface EditExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expense: ExpenseRecord | null;
  accounts: AccountOption[];
  onSave: (payload: {
    amount: number;
    date: string;
    category: string;
    description?: string;
    accountId: number;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  isSaving: boolean;
  isDeleting?: boolean;
  error?: string;
}

export function EditExpenseDialog({
  isOpen,
  onClose,
  expense,
  accounts,
  onSave,
  onDelete,
  isSaving,
  isDeleting = false,
  error: externalError,
}: EditExpenseDialogProps) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState<number | "">("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (expense) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmount(String(expense.amount));
      const parsed = parseDateAndTimeToInputs(expense.date);
      setDate(parsed.date);
      setTime(parsed.time);
      setCategory(expense.category || "Food");
      setDescription(expense.description || "");
      setAccountId(expense.accountId ?? "");
      setLocalError("");
    }
  }, [expense]);

  const selectedAccount =
    typeof accountId === "number"
      ? accounts.find((a) => a.id === accountId) || null
      : null;

  const isSameAccount =
    !!expense && typeof accountId === "number" && expense.accountId === accountId;
  const effectiveAvailable =
    selectedAccount && selectedAccount.balance !== undefined
      ? selectedAccount.balance + (isSameAccount ? Number(expense.amount) : 0)
      : undefined;

  const numAmount = Number(amount);
  const isInsufficient =
    selectedAccount &&
    effectiveAvailable !== undefined &&
    !Number.isNaN(numAmount) &&
    numAmount > effectiveAvailable;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!amount || !date || !category) {
      setLocalError("Please fill amount, date, and category.");
      return;
    }

    if (!accountId) {
      setLocalError("Please select the paying account.");
      return;
    }

    if (Number.isNaN(numAmount) || numAmount <= 0) {
      setLocalError("Amount must be a positive number.");
      return;
    }

    if (isInsufficient && selectedAccount && effectiveAvailable !== undefined) {
      setLocalError(
        `Insufficient balance in ${selectedAccount.name}. Available balance is ${effectiveAvailable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${selectedAccount.baseCurrency}, but updated expense is ${numAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${selectedAccount.baseCurrency}. You cannot put an account into a negative balance.`
      );
      return;
    }

    const isoDate = constructIsoDateTime(date, time);

    await onSave({
      amount: numAmount,
      date: isoDate,
      category,
      description: description.trim() || undefined,
      accountId: Number(accountId),
    });
  };

  const displayedError = localError || externalError;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            <Pencil className="h-5 w-5" />
          </div>
          <span>Edit Expense</span>
        </div>
      }
      description="Update expense details and keep account balances synchronized."
      maxWidth="xl"
    >
      {displayedError && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
        >
          {displayedError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="25.00"
            required
          />

          <div>
            <Select
              label="Paid From"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : "")}
              required
            >
              <option value="">Select account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {`${acc.name} (${acc.baseCurrency})`}
                </option>
              ))}
            </Select>
            {selectedAccount && effectiveAvailable !== undefined && (
              <div className="mt-1.5 flex items-center justify-between px-1 text-xs">
                <span className="text-slate-500 dark:text-slate-400">Available:</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  {effectiveAvailable.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {selectedAccount.baseCurrency}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Shopping">Shopping</option>
            <option value="Bills">Bills</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Subscriptions">Subscriptions</option>
            <option value="Other">Other</option>
          </Select>

          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Groceries, Uber, etc."
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker?.();
                } catch {}
              }}
              required
              className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-[#070b14] dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Time
              </label>
              <button
                type="button"
                onClick={() => {
                  setDate(getTodayDateStr());
                  setTime(getCurrentTimeStr());
                }}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-500/10 transition-colors"
                title="Reset date & time to now"
              >
                Now
              </button>
            </div>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker?.();
                } catch {}
              }}
              required
              className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-[#070b14] dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {isInsufficient && selectedAccount && effectiveAvailable !== undefined && (
          <div
            role="alert"
            className="rounded-2xl border border-rose-200/80 bg-rose-50/80 p-3.5 text-xs leading-relaxed text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
          >
            <strong>Insufficient Balance:</strong> You have{" "}
            <span className="font-mono font-bold">
              {effectiveAvailable.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              {selectedAccount.baseCurrency}
            </span>{" "}
            available in {selectedAccount.name}, but this updated expense requires{" "}
            <span className="font-mono font-bold">
              {numAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              {selectedAccount.baseCurrency}
            </span>
            . You cannot put an account into a negative balance.
          </div>
        )}

        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Groceries, Uber, etc."
        />

        <div className="mt-6 flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
          {onDelete ? (
            <Button
              type="button"
              variant="outline"
              size="md"
              className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30"
              onClick={onDelete}
              disabled={isSaving || isDeleting}
              isLoading={isDeleting}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Delete
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isSaving || isDeleting}
              leftIcon={<X className="h-4 w-4" />}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={Boolean(isInsufficient) || isDeleting}
              isLoading={isSaving}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
