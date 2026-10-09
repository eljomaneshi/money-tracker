import React, { useEffect, useState } from "react";
import { Pencil, Save, X } from "lucide-react";
import { Button, Dialog, Input, Select } from "../ui";
import type { AccountOption } from "./ExpenseFilters";

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
  isSaving: boolean;
  error?: string;
}

const formatDateForInput = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function EditExpenseDialog({
  isOpen,
  onClose,
  expense,
  accounts,
  onSave,
  isSaving,
  error: externalError,
}: EditExpenseDialogProps) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState<number | "">("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (expense) {
      setAmount(String(expense.amount));
      setDate(formatDateForInput(expense.date));
      setCategory(expense.category || "Food");
      setDescription(expense.description || "");
      setAccountId(expense.accountId ?? "");
      setLocalError("");
    }
  }, [expense]);

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

    const numAmount = Number(amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      setLocalError("Amount must be a positive number.");
      return;
    }

    await onSave({
      amount: numAmount,
      date,
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
      maxWidth="lg"
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
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-[#070b14] dark:text-slate-100"
            />
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

          <Select
            label="Paid From"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : "")}
            required
          >
            <option value="">Select account</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.baseCurrency})
              </option>
            ))}
          </Select>
        </div>

        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Groceries, Uber, etc."
        />

        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isSaving}
            leftIcon={<X className="h-4 w-4" />}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
