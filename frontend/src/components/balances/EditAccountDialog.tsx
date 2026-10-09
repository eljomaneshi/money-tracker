import React from "react";
import { AlertCircle, Pencil, Save, Trash2 } from "lucide-react";
import { Dialog } from "../ui/Dialog";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import type { Account, AccountType, Currency } from "./AccountCard";

export interface EditAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  name: string;
  setName: (val: string) => void;
  type: AccountType;
  setType: (val: AccountType) => void;
  balance: string;
  setBalance: (val: string) => void;
  baseCurrency: Currency;
  setBaseCurrency: (val: Currency) => void;
  error: string;
  submitting: boolean;
  deleteConfirm: boolean;
  setDeleteConfirm: (val: boolean) => void;
  deleteSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: () => void;
}

export function EditAccountDialog({
  isOpen,
  onClose,
  account,
  name,
  setName,
  type,
  setType,
  balance,
  setBalance,
  baseCurrency,
  setBaseCurrency,
  error,
  submitting,
  deleteConfirm,
  setDeleteConfirm,
  deleteSubmitting,
  onSubmit,
  onDelete,
}: EditAccountDialogProps) {
  if (!account) return null;

  const isZeroBalance = Number(account.balance) === 0;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            <Pencil className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Edit Account
            </h3>
          </div>
        </div>
      }
      description={`Update account properties or ledger baseline for "${account.name}".`}
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
            label="Account Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Main Checking"
            required
          />

          <Select
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
            required
          >
            <option value="BANK">Bank Account</option>
            <option value="CASH">Cash Wallet</option>
            <option value="CRYPTO">Crypto Vault</option>
            <option value="OTHER">Other Asset</option>
          </Select>

          <Input
            label="Balance"
            type="number"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="0.00"
            required
          />

          <Select
            label="Currency"
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value as Currency)}
            required
          >
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
            <option value="GBP">GBP (£)</option>
            <option value="ALL">ALL (Lek)</option>
          </Select>
        </div>

        <div className="flex flex-col gap-4 pt-5 border-t border-slate-100 dark:border-white/5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {!deleteConfirm ? (
              <button
                type="button"
                disabled={!isZeroBalance || deleteSubmitting}
                onClick={() => setDeleteConfirm(true)}
                title={
                  !isZeroBalance
                    ? `Balance must be 0 to delete (current: ${account.balance} ${account.baseCurrency})`
                    : "Delete this account"
                }
                className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-200 px-3.5 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30 dark:disabled:border-white/5 dark:disabled:text-slate-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Account</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/50 p-2 dark:border-rose-900/40 dark:bg-rose-950/20">
                <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <span className="text-xs font-semibold text-rose-900 dark:text-rose-200">
                  Are you sure?
                </span>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  isLoading={deleteSubmitting}
                  onClick={onDelete}
                >
                  Confirm Delete
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5">
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
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
