import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Landmark,
  Pencil,
  Plus,
  Wallet,
} from "lucide-react";
import api from "../lib/api";
import { formatMoney, convertAmount, type ExchangeRates } from "../utils/formatMoney";
import {
  AccountCard,
  CompactAccountCard,
  type Account,
  type AccountType,
  type Currency,
} from "../components/balances/AccountCard";
import {
  AccountActionDialog,
  type ActionType,
} from "../components/balances/AccountActionDialog";
import { EditAccountDialog } from "../components/balances/EditAccountDialog";
import { ViewSwitcher, type ViewMode } from "../components/balances/ViewSwitcher";
import { Button, Card, Input, Select, Skeleton, Badge } from "../components/ui";

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

export default function Balance() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const accountNameInputRef = useRef<HTMLInputElement>(null);

  // New account form state
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("BANK");
  const [balance, setBalance] = useState("");
  const [baseCurrency, setBaseCurrency] = useState<Currency>("EUR");

  // Edit account modal state
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<AccountType>("BANK");
  const [editBalance, setEditBalance] = useState("");
  const [editBaseCurrency, setEditBaseCurrency] = useState<Currency>("EUR");
  const [editError, setEditError] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem("balance_view_mode") as ViewMode) || "comfortable";
  });

  // Action modal state (Deposit / Withdraw / Transfer)
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType>("DEPOSIT");
  const [actionAmount, setActionAmount] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [actionDate, setActionDate] = useState("");
  const [actionDescription, setActionDescription] = useState("");
  const [fromAccountId, setFromAccountId] = useState<number | "">("");
  const [toAccountId, setToAccountId] = useState<number | "">("");
  const [actionError, setActionError] = useState("");
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [accountsRes, ratesRes, settingsRes] = await Promise.all([
        api.get("/accounts"),
        api.get("/accounts/exchange-rates"),
        api.get("/users/me/settings"),
      ]);

      setAccounts(accountsRes.data.accounts || []);
      setRates(ratesRes.data.rates || null);
      setSettings(settingsRes.data || null);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to load balance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    return accounts.reduce((sum, account) => {
      return sum + convertAmount(account.balance, account.baseCurrency, mainCurrency, rates);
    }, 0);
  }, [accounts, rates, mainCurrency]);

  const totalBalanceSecond = useMemo(() => {
    if (!rates || !showSecondCurrency) return 0;
    return accounts.reduce((sum, account) => {
      return sum + convertAmount(account.balance, account.baseCurrency, secondCurrency, rates);
    }, 0);
  }, [accounts, rates, secondCurrency, showSecondCurrency]);

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("balance_view_mode", mode);
  };

  const moveAccount = (index: number, direction: "up" | "down") => {
    const newAccounts = [...accounts];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newAccounts.length) return;

    [newAccounts[index], newAccounts[targetIndex]] = [
      newAccounts[targetIndex],
      newAccounts[index],
    ];
    setAccounts(newAccounts);

    api
      .patch("/accounts/reorder", { orderedIds: newAccounts.map((a) => a.id) })
      .catch((err) => {
        console.error("Reorder failed:", err.response?.data || err);
        fetchData();
      });
  };

  const resetCreateForm = () => {
    setName("");
    setType("BANK");
    setBalance("");
    setBaseCurrency("EUR");
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || balance === "") {
      setError("Please provide both account name and opening balance.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/accounts", {
        name: name.trim(),
        type,
        balance: Number(balance),
        baseCurrency,
      });
      resetCreateForm();
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setEditName(account.name);
    setEditType(account.type);
    setEditBalance(String(account.balance));
    setEditBaseCurrency(account.baseCurrency);
    setEditError("");
    setDeleteConfirm(false);
  };

  const closeEditModal = () => {
    setEditingAccount(null);
    setEditName("");
    setEditType("BANK");
    setEditBalance("");
    setEditBaseCurrency("EUR");
    setEditError("");
    setDeleteConfirm(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");

    if (!editingAccount) return;

    if (!editName.trim() || editBalance === "") {
      setEditError("Please fill account name and balance");
      return;
    }

    try {
      setEditSubmitting(true);
      await api.patch(`/accounts/${editingAccount.id}`, {
        name: editName.trim(),
        type: editType,
        balance: Number(editBalance),
        baseCurrency: editBaseCurrency,
      });
      closeEditModal();
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setEditError(err.response?.data?.error || "Failed to update account");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!editingAccount) return;
    setEditError("");
    try {
      setDeleteSubmitting(true);
      await api.delete(`/accounts/${editingAccount.id}`);
      closeEditModal();
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setEditError(err.response?.data?.message || "Failed to delete account");
      setDeleteConfirm(false);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const openActionModal = (nextType: ActionType) => {
    setActionType(nextType);
    setActionAmount("");
    setTargetAmount("");
    setActionDate(new Date().toISOString().slice(0, 10));
    setActionDescription("");
    setFromAccountId(accounts.length > 0 ? accounts[0].id : "");
    setToAccountId(accounts.length > 1 ? accounts[1].id : "");
    setActionError("");
    setActionModalOpen(true);
  };

  const closeActionModal = () => {
    setActionModalOpen(false);
    setActionAmount("");
    setTargetAmount("");
    setActionDate("");
    setActionDescription("");
    setFromAccountId("");
    setToAccountId("");
    setActionError("");
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");

    if (!actionAmount || !actionDate) {
      setActionError("Please provide both amount and transaction date.");
      return;
    }

    const selectedFrom = accounts.find((a) => a.id === fromAccountId);
    const selectedTo = accounts.find((a) => a.id === toAccountId);
    const isCrossCurrency =
      actionType === "TRANSFER" &&
      !!selectedFrom &&
      !!selectedTo &&
      selectedFrom.baseCurrency !== selectedTo.baseCurrency;

    if (actionType === "TRANSFER") {
      if (!fromAccountId || !toAccountId) {
        setActionError("Please select both source and destination accounts");
        return;
      }
      if (fromAccountId === toAccountId) {
        setActionError("Source and destination accounts must be different");
        return;
      }
      if (isCrossCurrency && !targetAmount) {
        setActionError("Please enter the received amount for the destination account");
        return;
      }
    } else {
      if (!fromAccountId) {
        setActionError("Please select an account");
        return;
      }
    }

    try {
      setActionSubmitting(true);

      if (actionType === "DEPOSIT") {
        await api.post("/account-actions/deposit", {
          accountId: fromAccountId,
          amount: Number(actionAmount),
          date: actionDate,
          description: actionDescription || undefined,
        });
      } else if (actionType === "WITHDRAWAL") {
        await api.post("/account-actions/withdraw", {
          accountId: fromAccountId,
          amount: Number(actionAmount),
          date: actionDate,
          description: actionDescription || undefined,
        });
      } else {
        await api.post("/account-actions/transfer", {
          fromAccountId,
          toAccountId,
          amount: Number(actionAmount),
          targetAmount: isCrossCurrency ? Number(targetAmount) : Number(actionAmount),
          date: actionDate,
          description: actionDescription || undefined,
        });
      }

      closeActionModal();
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setActionError(err.response?.data?.error || "Failed to record transaction action");
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Title */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <Landmark className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Balances & Accounts
          </h1>
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
          Manage your accounts, record instant deposits/withdrawals, and execute transfers.
        </p>
      </div>

      {/* Net Combined Balance Hero Card */}
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-200 dark:border-white/10 dark:bg-[#0d1526] sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl dark:bg-emerald-500/10"
        />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Balance
                </p>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
                  Overview
                </h2>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
              Combined ledger balance across all {accounts.length} active{" "}
              {accounts.length === 1 ? "account" : "accounts"}
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-start gap-2.5 md:items-end">
              <Skeleton className="h-10 w-48 rounded-2xl sm:h-12 sm:w-60" />
              {showSecondCurrency && <Skeleton className="h-6 w-32 rounded-xl" />}
            </div>
          ) : error ? (
            <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
          ) : (
            <div className="flex flex-col items-start gap-2 md:items-end">
              <p className="font-mono text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-slate-100 sm:text-4xl lg:text-5xl">
                {formatMoney(
                  totalBalanceMain,
                  mainCurrency,
                  mainCurrency === "ALL" ? "after" : "before"
                )}
              </p>
              {showSecondCurrency && (
                <div className="inline-flex items-center gap-2 rounded-xl bg-teal-50 px-3 py-1 font-mono text-sm font-bold text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                  <span className="text-[11px] font-medium uppercase tracking-wider opacity-75">Secondary</span>
                  <span className="tabular-nums">
                    {formatMoney(
                      totalBalanceSecond,
                      secondCurrency,
                      secondCurrency === "ALL" ? "after" : "before"
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Quick Action Triggers Row */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => openActionModal("DEPOSIT")}
          className="group relative flex items-center gap-4 rounded-[28px] border border-slate-200/90 bg-white p-5 text-left shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300 dark:border-white/10 dark:bg-[#0d1526] dark:hover:border-emerald-500/30 dark:hover:bg-[#111a30]"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 transition-transform group-hover:scale-105 dark:bg-emerald-950/60 dark:text-emerald-300">
            <ArrowDownLeft className="h-6 w-6" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100">Deposit</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Credit funds to an account
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openActionModal("WITHDRAWAL")}
          className="group relative flex items-center gap-4 rounded-[28px] border border-slate-200/90 bg-white p-5 text-left shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-rose-300 dark:border-white/10 dark:bg-[#0d1526] dark:hover:border-rose-500/30 dark:hover:bg-[#111a30]"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 transition-transform group-hover:scale-105 dark:bg-rose-950/60 dark:text-rose-300">
            <ArrowUpRight className="h-6 w-6" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100">Withdraw</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Debit funds from an account
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openActionModal("TRANSFER")}
          className="group relative flex items-center gap-4 rounded-[28px] border border-slate-200/90 bg-white p-5 text-left shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-blue-300 dark:border-white/10 dark:bg-[#0d1526] dark:hover:border-blue-500/30 dark:hover:bg-[#111a30]"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 transition-transform group-hover:scale-105 dark:bg-blue-950/60 dark:text-blue-300">
            <ArrowLeftRight className="h-6 w-6" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100">Transfer</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Move funds between accounts
            </p>
          </div>
        </button>
      </section>

      {/* Add New Account Form Card */}
      <Card padding="md" className="rounded-[28px]">
        <div className="mb-5 flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-xl">
              Add New Account
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              Create a bank, cash, crypto, or custom liquidity account.
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-5 rounded-2xl border border-rose-200/80 bg-rose-50/80 px-4 py-3 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleCreateAccount} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <Input
              ref={accountNameInputRef}
              label="Account Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Primary Bank, Cash Vault"
              required
            />
          </div>

          <div>
            <Select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              required
            >
              <option value="BANK">Bank Account</option>
              <option value="CASH">Cash Wallet</option>
              <option value="CRYPTO">Crypto Vault</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>

          <div>
            <Input
              label="Opening Balance"
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Select
              label="Base Currency"
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

          <div className="flex items-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={submitting}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              {submitting ? "Adding..." : "Add Account"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Account Collection & Views */}
      <section>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-44 rounded-[28px]" />
            <Skeleton className="h-44 rounded-[28px]" />
            <Skeleton className="h-44 rounded-[28px]" />
          </div>
        ) : accounts.length === 0 ? (
          /* Actionable empty state card */
          <div className="rounded-[28px] border border-slate-200/90 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#0d1526] sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <Wallet className="h-7 w-7" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
              No accounts yet
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
              Add your bank accounts, cash wallets, or crypto balances to start tracking your net worth and balances.
            </p>
            <div className="mt-6">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => {
                  accountNameInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  accountNameInputRef.current?.focus();
                }}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add your first account
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Control Bar: Account count + View Switcher */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {accounts.length} {accounts.length === 1 ? "Account" : "Accounts"}
                </p>
                <span className="text-xs text-slate-400 dark:text-slate-500">• Reorderable</span>
              </div>

              <ViewSwitcher viewMode={viewMode} onChange={changeViewMode} />
            </div>

            {/* Comfortable Grid View */}
            {viewMode === "comfortable" && (
              <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                {accounts.map((acc, i) => (
                  <AccountCard
                    key={acc.id}
                    account={acc}
                    mainCurrency={mainCurrency}
                    secondCurrency={secondCurrency}
                    showSecondCurrency={showSecondCurrency}
                    rates={rates}
                    onEdit={openEditModal}
                    onMoveUp={() => moveAccount(i, "up")}
                    onMoveDown={() => moveAccount(i, "down")}
                    isFirst={i === 0}
                    isLast={i === accounts.length - 1}
                  />
                ))}
              </div>
            )}

            {/* Compact Grid View */}
            {viewMode === "compact" && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {accounts.map((acc, i) => (
                  <CompactAccountCard
                    key={acc.id}
                    account={acc}
                    mainCurrency={mainCurrency}
                    rates={rates}
                    onEdit={openEditModal}
                    onMoveUp={() => moveAccount(i, "up")}
                    onMoveDown={() => moveAccount(i, "down")}
                    isFirst={i === 0}
                    isLast={i === accounts.length - 1}
                  />
                ))}
              </div>
            )}

            {/* Table List View */}
            {viewMode === "list" && (
              <div className="overflow-x-auto rounded-[28px] border border-slate-200/90 bg-white shadow-sm dark:border-white/10 dark:bg-[#0d1526]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/8 bg-slate-50/50 dark:bg-white/2">
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Account
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Type
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Balance
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Converted ({mainCurrency})
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {accounts.map((acc, i) => (
                      <tr
                        key={acc.id}
                        className="transition-colors hover:bg-slate-50/60 dark:hover:bg-white/2"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-900 dark:text-slate-100">
                          {acc.name}
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant="neutral" className="text-[11px] uppercase tracking-wider">
                            {acc.type}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-bold text-slate-900 tabular-nums dark:text-slate-100">
                          {formatMoney(
                            acc.balance,
                            acc.baseCurrency,
                            acc.baseCurrency === "ALL" ? "after" : "before"
                          )}
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                          {rates && acc.baseCurrency !== mainCurrency
                            ? formatMoney(
                                convertAmount(acc.balance, acc.baseCurrency, mainCurrency, rates),
                                mainCurrency,
                                mainCurrency === "ALL" ? "after" : "before"
                              )
                            : "—"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => moveAccount(i, "up")}
                              disabled={i === 0}
                              title="Move up"
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-20 dark:hover:bg-white/10 dark:hover:text-slate-200"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveAccount(i, "down")}
                              disabled={i === accounts.length - 1}
                              title="Move down"
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-20 dark:hover:bg-white/10 dark:hover:text-slate-200"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(acc)}
                              className="ml-1 inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-white hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                            >
                              <Pencil className="h-3 w-3 text-amber-500" />
                              <span>Edit</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

      {/* Action Dialog (Deposit / Withdraw / Transfer) */}
      <AccountActionDialog
        isOpen={actionModalOpen}
        onClose={closeActionModal}
        actionType={actionType}
        accounts={accounts}
        amount={actionAmount}
        setAmount={setActionAmount}
        targetAmount={targetAmount}
        setTargetAmount={setTargetAmount}
        date={actionDate}
        setDate={setActionDate}
        description={actionDescription}
        setDescription={setActionDescription}
        fromAccountId={fromAccountId}
        setFromAccountId={setFromAccountId}
        toAccountId={toAccountId}
        setToAccountId={setToAccountId}
        error={actionError}
        submitting={actionSubmitting}
        onSubmit={handleActionSubmit}
      />

      {/* Edit Account Dialog */}
      <EditAccountDialog
        isOpen={!!editingAccount}
        onClose={closeEditModal}
        account={editingAccount}
        name={editName}
        setName={setEditName}
        type={editType}
        setType={setEditType}
        balance={editBalance}
        setBalance={setEditBalance}
        baseCurrency={editBaseCurrency}
        setBaseCurrency={setEditBaseCurrency}
        error={editError}
        submitting={editSubmitting}
        deleteConfirm={deleteConfirm}
        setDeleteConfirm={setDeleteConfirm}
        deleteSubmitting={deleteSubmitting}
        onSubmit={handleEditSubmit}
        onDelete={handleDeleteAccount}
      />
    </div>
  );
}
