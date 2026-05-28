import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Landmark,
  Pencil,
  Plus,
  Save,
  Wallet,
  X,
} from "lucide-react";
import api from "../lib/api";
import { formatMoney } from "../utils/formatMoney";

type Currency = "ALL" | "EUR" | "GBP" | "USD";
type AccountType = "BANK" | "CASH" | "CRYPTO" | "OTHER";
type ActionType = "DEPOSIT" | "WITHDRAWAL" | "TRANSFER";

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

function AccountCard({
  account,
  mainCurrency,
  secondCurrency,
  showSecondCurrency,
  rates,
  onEdit,
}: {
  account: Account;
  mainCurrency: Currency;
  secondCurrency: Currency;
  showSecondCurrency: boolean;
  rates: ExchangeRates | null;
  onEdit: (account: Account) => void;
}) {
  const convertedMain = rates
    ? convertAmount(account.balance, account.baseCurrency, mainCurrency, rates)
    : 0;

  const convertedSecond =
    rates && showSecondCurrency
      ? convertAmount(account.balance, account.baseCurrency, secondCurrency, rates)
      : 0;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-xl font-bold text-slate-900 dark:text-slate-100">
                {account.name}
              </h3>
              <p className="mt-1 text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {account.type}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onEdit(account)}
          className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </button>
      </div>

      <div className="mt-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">Balance</p>
        <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          {formatMoney(
            account.balance,
            account.baseCurrency,
            account.baseCurrency === "ALL" ? "after" : "before"
          )}
        </p>

        {rates && account.baseCurrency !== mainCurrency && (
          <p className="mt-2 text-base font-semibold text-blue-700 dark:text-blue-400">
            {formatMoney(
              convertedMain,
              mainCurrency,
              mainCurrency === "ALL" ? "after" : "before"
            )}
          </p>
        )}

        {rates &&
          showSecondCurrency &&
          secondCurrency !== mainCurrency &&
          account.baseCurrency !== secondCurrency && (
            <p className="mt-1 text-sm font-medium text-teal-700 dark:text-teal-400">
              {formatMoney(
                convertedSecond,
                secondCurrency,
                secondCurrency === "ALL" ? "after" : "before"
              )}
            </p>
          )}
      </div>
    </div>
  );
}

export default function Balance() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("BANK");
  const [balance, setBalance] = useState("");
  const [baseCurrency, setBaseCurrency] = useState<Currency>("EUR");

  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<AccountType>("BANK");
  const [editBalance, setEditBalance] = useState("");
  const [editBaseCurrency, setEditBaseCurrency] = useState<Currency>("EUR");
  const [editError, setEditError] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType>("DEPOSIT");
  const [actionAmount, setActionAmount] = useState("");
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
      return (
        sum +
        convertAmount(account.balance, account.baseCurrency, mainCurrency, rates)
      );
    }, 0);
  }, [accounts, rates, mainCurrency]);

  const totalBalanceSecond = useMemo(() => {
    if (!rates || !showSecondCurrency) return 0;

    return accounts.reduce((sum, account) => {
      return (
        sum +
        convertAmount(account.balance, account.baseCurrency, secondCurrency, rates)
      );
    }, 0);
  }, [accounts, rates, secondCurrency, showSecondCurrency]);

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
      setError("Please fill account name and balance");
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
  };

  const closeEditModal = () => {
    setEditingAccount(null);
    setEditName("");
    setEditType("BANK");
    setEditBalance("");
    setEditBaseCurrency("EUR");
    setEditError("");
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

      await api.put(`/accounts/${editingAccount.id}`, {
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

  const openActionModal = (nextType: ActionType) => {
    setActionType(nextType);
    setActionAmount("");
    setActionDate("");
    setActionDescription("");
    setFromAccountId("");
    setToAccountId("");
    setActionError("");
    setActionModalOpen(true);
  };

  const closeActionModal = () => {
    setActionModalOpen(false);
    setActionAmount("");
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
      setActionError("Please fill amount and date");
      return;
    }

    if (actionType === "TRANSFER") {
      if (!fromAccountId || !toAccountId) {
        setActionError("Please select both source and destination accounts");
        return;
      }

      if (fromAccountId === toAccountId) {
        setActionError("Source and destination accounts must be different");
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
          date: actionDate,
          description: actionDescription || undefined,
        });
      }

      closeActionModal();
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setActionError(err.response?.data?.error || "Failed to save action");
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
            <Landmark className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Balances
          </h1>
        </div>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
          Manage your accounts, balances, deposits, withdrawals, and transfers.
        </p>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
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
                  Overview
                </h2>
              </div>
            </div>

            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
              Combined balance across all accounts
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

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <button
          type="button"
          onClick={() => openActionModal("DEPOSIT")}
          className="inline-flex items-center justify-start gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-5 text-left shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
        >
          <div className="rounded-2xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            <ArrowDownLeft className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-900 dark:text-slate-100">Deposit</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Add money to an account
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openActionModal("WITHDRAWAL")}
          className="inline-flex items-center justify-start gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-5 text-left shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
        >
          <div className="rounded-2xl bg-rose-100 p-2.5 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
            <ArrowUpRight className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-900 dark:text-slate-100">Withdraw</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Remove money from an account
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openActionModal("TRANSFER")}
          className="inline-flex items-center justify-start gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-5 text-left shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
        >
          <div className="rounded-2xl bg-blue-100 p-2.5 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
            <ArrowLeftRight className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-900 dark:text-slate-100">Transfer</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Move money between accounts
            </p>
          </div>
        </button>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-2xl bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Add New Account
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create a bank, cash, crypto, or other account.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <form
          onSubmit={handleCreateAccount}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Account Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Main Bank"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
            >
              <option value="BANK">Bank</option>
              <option value="CASH">Cash</option>
              <option value="CRYPTO">Crypto</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Balance
            </label>
            <input
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Currency
            </label>
            <select
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value as Currency)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="ALL">ALL</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 dark:disabled:bg-blue-900/40"
            >
              <Plus className="h-4 w-4" />
              {submitting ? "Adding..." : "Add account"}
            </button>
          </div>
        </form>
      </section>

      <section>
        {loading ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">Loading...</p>
        ) : accounts.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 sm:p-8">
            No accounts found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                mainCurrency={mainCurrency}
                secondCurrency={secondCurrency}
                showSecondCurrency={showSecondCurrency}
                rates={rates}
                onEdit={openEditModal}
              />
            ))}
          </div>
        )}
      </section>

      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
                    Edit Account
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Update the account details and balance.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
                Close
              </button>
            </div>

            {editError && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                {editError}
              </div>
            )}

            <form
              onSubmit={handleEditSubmit}
              className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Account Name
                </label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Type
                </label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as AccountType)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                >
                  <option value="BANK">Bank</option>
                  <option value="CASH">Cash</option>
                  <option value="CRYPTO">Crypto</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Currency
                </label>
                <select
                  value={editBaseCurrency}
                  onChange={(e) => setEditBaseCurrency(e.target.value as Currency)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="ALL">ALL</option>
                </select>
              </div>

              <div className="flex items-end gap-3 md:col-span-2 xl:col-span-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 dark:disabled:bg-blue-900/40"
                >
                  <Save className="h-4 w-4" />
                  {editSubmitting ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {actionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`rounded-2xl p-2.5 ${
                    actionType === "DEPOSIT"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : actionType === "WITHDRAWAL"
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                  }`}
                >
                  {actionType === "DEPOSIT" ? (
                    <ArrowDownLeft className="h-5 w-5" />
                  ) : actionType === "WITHDRAWAL" ? (
                    <ArrowUpRight className="h-5 w-5" />
                  ) : (
                    <ArrowLeftRight className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
                    {actionType === "DEPOSIT"
                      ? "Deposit Money"
                      : actionType === "WITHDRAWAL"
                      ? "Withdraw Money"
                      : "Transfer Money"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {actionType === "DEPOSIT"
                      ? "Add funds to one of your accounts."
                      : actionType === "WITHDRAWAL"
                      ? "Remove funds from one of your accounts."
                      : "Move funds between two accounts."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeActionModal}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
                Close
              </button>
            </div>

            {actionError && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                {actionError}
              </div>
            )}

            <form
              onSubmit={handleActionSubmit}
              className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  placeholder="100.00"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Date
                </label>
                <input
                  type="date"
                  value={actionDate}
                  onChange={(e) => setActionDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                />
              </div>

              {actionType === "TRANSFER" ? (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      From Account
                    </label>
                    <select
                      value={fromAccountId}
                      onChange={(e) =>
                        setFromAccountId(e.target.value ? Number(e.target.value) : "")
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                    >
                      <option value="">Select account</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({account.baseCurrency})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      To Account
                    </label>
                    <select
                      value={toAccountId}
                      onChange={(e) =>
                        setToAccountId(e.target.value ? Number(e.target.value) : "")
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                    >
                      <option value="">Select account</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({account.baseCurrency})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Account
                  </label>
                  <select
                    value={fromAccountId}
                    onChange={(e) =>
                      setFromAccountId(e.target.value ? Number(e.target.value) : "")
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.baseCurrency})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="md:col-span-2 xl:col-span-3">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <input
                  value={actionDescription}
                  onChange={(e) => setActionDescription(e.target.value)}
                  placeholder="Optional note for this action"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                />
              </div>

              <div className="flex items-end gap-3 md:col-span-2 xl:col-span-3">
                <button
                  type="button"
                  onClick={closeActionModal}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionSubmitting}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 dark:disabled:bg-blue-900/40"
                >
                  <Save className="h-4 w-4" />
                  {actionSubmitting ? "Saving..." : "Save action"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}