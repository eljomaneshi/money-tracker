import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Coins,
  Landmark,
  Pencil,
  PiggyBank,
  Plus,
  Save,
  Trash2,
  Wallet,
  WalletCards,
  X,
} from "lucide-react";
import api from "../lib/api";
import { formatMoney } from "../utils/formatMoney";

type Currency = "ALL" | "EUR" | "GBP" | "USD";
type AccountType = "BANK" | "CASH" | "CRYPTO" | "OTHER";

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

type SettingsResponse = {
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

const getAccountTypeMeta = (type: AccountType) => {
  switch (type) {
    case "BANK":
      return {
        label: "Bank",
        icon: Landmark,
        wrapperClassName:
          "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300",
      };
    case "CASH":
      return {
        label: "Cash",
        icon: Wallet,
        wrapperClassName:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
      };
    case "CRYPTO":
      return {
        label: "Crypto",
        icon: Coins,
        wrapperClassName:
          "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
      };
    default:
      return {
        label: "Other",
        icon: PiggyBank,
        wrapperClassName:
          "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
      };
  }
};

export default function Balance() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("BANK");
  const [balance, setBalance] = useState("");
  const [baseCurrency, setBaseCurrency] = useState<Currency>("EUR");
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<AccountType>("BANK");
  const [editBalance, setEditBalance] = useState("");
  const [editBaseCurrency, setEditBaseCurrency] = useState<Currency>("EUR");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [accountsRes, ratesRes, settingsRes] = await Promise.all([
        api.get("/accounts"),
        api.get("/accounts/exchange-rates"),
        api.get<SettingsResponse>("/users/me/settings"),
      ]);

      setAccounts(accountsRes.data.accounts || []);
      setRates(ratesRes.data.rates);
      setSettings(settingsRes.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to load accounts");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !balance || !type || !baseCurrency) {
      setError("Please fill all fields");
      return;
    }

    try {
      setSubmitting(true);

      const res = await api.post("/accounts", {
        name,
        type,
        balance: Number(balance),
        baseCurrency,
      });

      const newAccount: Account = res.data.account;
      setAccounts((prev) => [...prev, newAccount]);

      setName("");
      setType("BANK");
      setBalance("");
      setBaseCurrency("EUR");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (account: Account) => {
    setEditingId(account.id);
    setEditName(account.name);
    setEditType(account.type);
    setEditBalance(String(account.balance));
    setEditBaseCurrency(account.baseCurrency);
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditType("BANK");
    setEditBalance("");
    setEditBaseCurrency("EUR");
  };

  const handleSaveEdit = async (id: number) => {
    if (!editName || !editBalance || !editType || !editBaseCurrency) {
      setError("Please fill all edit fields");
      return;
    }

    try {
      setSavingEdit(true);

      const res = await api.patch(`/accounts/${id}`, {
        name: editName,
        type: editType,
        balance: Number(editBalance),
        baseCurrency: editBaseCurrency,
      });

      const updatedAccount: Account = res.data.account;

      setAccounts((prev) =>
        prev.map((acc) => (acc.id === id ? updatedAccount : acc))
      );

      cancelEdit();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to update account");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!accountToDelete) return;

    try {
      setDeletingId(accountToDelete.id);
      await api.delete(`/accounts/${accountToDelete.id}`);
      setAccounts((prev) => prev.filter((acc) => acc.id !== accountToDelete.id));

      if (editingId === accountToDelete.id) {
        cancelEdit();
      }

      setAccountToDelete(null);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to delete account");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="space-y-6 sm:space-y-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-teal-100 p-2.5 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
              <WalletCards className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
              Balance
            </h1>
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
            Manage your accounts and track your total available balance.
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
                Create a bank, cash, crypto, or other resource.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5"
          >
            <div className="md:col-span-2 xl:col-span-1">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Raiffeisen Bank / Wallet / Binance"
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
                Base Currency
              </label>
              <select
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value as Currency)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
              >
                <option value="ALL">ALL</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Opening Balance
              </label>
              <input
                type="number"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="1200.00"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
              />
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

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-2xl bg-slate-200 p-2.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <WalletCards className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Your Accounts
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                View and manage all account balances in one place.
              </p>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">Loading...</p>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No accounts yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {accounts.map((acc) => {
                const convertedAmount =
                  rates && showSecondCurrency
                    ? convertAmount(acc.balance, acc.baseCurrency, secondCurrency, rates)
                    : null;

                const shouldShowConverted =
                  showSecondCurrency &&
                  convertedAmount !== null &&
                  secondCurrency !== acc.baseCurrency;

                const typeMeta = getAccountTypeMeta(acc.type);
                const TypeIcon = typeMeta.icon;

                return (
                  <div
                    key={acc.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950"
                  >
                    {editingId === acc.id ? (
                      <>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="mb-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                        />

                        <select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value as AccountType)}
                          className="mb-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                        >
                          <option value="BANK">Bank</option>
                          <option value="CASH">Cash</option>
                          <option value="CRYPTO">Crypto</option>
                          <option value="OTHER">Other</option>
                        </select>

                        <select
                          value={editBaseCurrency}
                          onChange={(e) => setEditBaseCurrency(e.target.value as Currency)}
                          className="mb-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                        >
                          <option value="ALL">ALL</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="USD">USD</option>
                        </select>

                        <input
                          type="number"
                          step="0.01"
                          value={editBalance}
                          onChange={(e) => setEditBalance(e.target.value)}
                          className="mb-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                        />

                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(acc.id)}
                            disabled={savingEdit}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300 dark:disabled:bg-green-900/40"
                          >
                            <Save className="h-4 w-4" />
                            {savingEdit ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start gap-3">
                          <div className={`rounded-2xl p-2.5 ${typeMeta.wrapperClassName}`}>
                            <TypeIcon className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
                              {acc.name}
                            </p>
                            <p className="mt-1 text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              {typeMeta.label} • {acc.baseCurrency}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6">
                          <p
                            className={`font-extrabold text-slate-900 dark:text-slate-100 ${
                              acc.baseCurrency === "ALL" ? "text-2xl" : "text-3xl"
                            }`}
                          >
                            {formatMoney(
                              acc.balance,
                              acc.baseCurrency,
                              acc.baseCurrency === "ALL" ? "after" : "before"
                            )}
                          </p>

                          {shouldShowConverted && (
                            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                              {formatMoney(
                                convertedAmount,
                                secondCurrency,
                                secondCurrency === "ALL" ? "after" : "before"
                              )}
                            </p>
                          )}
                        </div>

                        <div className="mt-6 flex gap-3">
                          <button
                            type="button"
                            onClick={() => startEdit(acc)}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setAccountToDelete(acc)}
                            disabled={deletingId === acc.id}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300 dark:disabled:bg-red-900/40"
                          >
                            <Trash2 className="h-4 w-4" />
                            {deletingId === acc.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {accountToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-rose-100 p-2.5 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Delete account?
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  This will permanently remove <span className="font-semibold">{accountToDelete.name}</span>
                  {" "}from your balance list. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                disabled={deletingId === accountToDelete.id}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deletingId === accountToDelete.id}
                className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId === accountToDelete.id ? "Deleting..." : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}