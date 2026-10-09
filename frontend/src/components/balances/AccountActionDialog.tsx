import React from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Save } from "lucide-react";
import { Dialog } from "../ui/Dialog";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import type { Account } from "./AccountCard";

export type ActionType = "DEPOSIT" | "WITHDRAWAL" | "TRANSFER";

export interface AccountActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: ActionType;
  accounts: Account[];
  amount: string;
  setAmount: (val: string) => void;
  targetAmount: string;
  setTargetAmount: (val: string) => void;
  date: string;
  setDate: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  fromAccountId: number | "";
  setFromAccountId: (val: number | "") => void;
  toAccountId: number | "";
  setToAccountId: (val: number | "") => void;
  error: string;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function AccountActionDialog({
  isOpen,
  onClose,
  actionType,
  accounts,
  amount,
  setAmount,
  targetAmount,
  setTargetAmount,
  date,
  setDate,
  description,
  setDescription,
  fromAccountId,
  setFromAccountId,
  toAccountId,
  setToAccountId,
  error,
  submitting,
  onSubmit,
}: AccountActionDialogProps) {
  const selectedFromAccount =
    typeof fromAccountId === "number"
      ? accounts.find((account) => account.id === fromAccountId) || null
      : null;

  const selectedToAccount =
    typeof toAccountId === "number"
      ? accounts.find((account) => account.id === toAccountId) || null
      : null;

  const isCrossCurrencyTransfer =
    actionType === "TRANSFER" &&
    !!selectedFromAccount &&
    !!selectedToAccount &&
    selectedFromAccount.baseCurrency !== selectedToAccount.baseCurrency;

  const titleText =
    actionType === "DEPOSIT"
      ? "Deposit Funds"
      : actionType === "WITHDRAWAL"
      ? "Withdraw Funds"
      : "Transfer Between Accounts";

  const descriptionText =
    actionType === "DEPOSIT"
      ? "Credit funds to an account."
      : actionType === "WITHDRAWAL"
      ? "Debit funds from an account."
      : "Move funds seamlessly between accounts.";

  const ActionIcon =
    actionType === "DEPOSIT"
      ? ArrowDownLeft
      : actionType === "WITHDRAWAL"
      ? ArrowUpRight
      : ArrowLeftRight;

  const iconBg =
    actionType === "DEPOSIT"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
      : actionType === "WITHDRAWAL"
      ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
      : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300";

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title={
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
            <ActionIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {titleText}
            </h3>
          </div>
        </div>
      }
      description={descriptionText}
    >
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-5 rounded-2xl border border-rose-200/80 bg-rose-50/80 px-4 py-3 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
        >
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={actionType === "TRANSFER" ? "Amount Sent" : "Amount"}
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100.00"
            required
          />

          {isCrossCurrencyTransfer && (
            <Input
              label="Amount Received (Destination)"
              type="number"
              min="0"
              step="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="9500.00"
              required
            />
          )}

          <div className="w-full">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-[#070b14] dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
            />
          </div>

          {actionType === "TRANSFER" ? (
            <>
              <Select
                label="Source Account (From)"
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value ? Number(e.target.value) : "")}
                required
              >
                <option value="">Select source account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.baseCurrency})
                  </option>
                ))}
              </Select>

              <Select
                label="Destination Account (To)"
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value ? Number(e.target.value) : "")}
                required
              >
                <option value="">Select destination account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.baseCurrency})
                  </option>
                ))}
              </Select>
            </>
          ) : (
            <Select
              label="Account"
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value ? Number(e.target.value) : "")}
              required
            >
              <option value="">Select account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.baseCurrency})
                </option>
              ))}
            </Select>
          )}
        </div>

        {isCrossCurrencyTransfer && selectedFromAccount && selectedToAccount && (
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs leading-relaxed text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            <strong>Cross-currency transfer:</strong> Transferring from{" "}
            <span className="font-mono font-bold">{selectedFromAccount.baseCurrency}</span> to{" "}
            <span className="font-mono font-bold">{selectedToAccount.baseCurrency}</span>. Please enter the
            exact amount credited after foreign exchange conversion.
          </div>
        )}

        <Input
          label="Description / Reference (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Monthly salary deposit, ATM cash withdrawal, Savings transfer"
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={submitting}
            leftIcon={<Save className="h-4 w-4" />}
          >
            {submitting ? "Saving..." : "Record Action"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
