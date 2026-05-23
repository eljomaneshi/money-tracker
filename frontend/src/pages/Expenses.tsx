import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Filter,
  Pencil,
  Plus,
  Receipt,
  Save,
  Wallet,
  X,
} from "lucide-react";
import api from "../lib/api";
import { formatMoney } from "../utils/formatMoney";

type Currency = "EUR" | "ALL" | "GBP" | "USD";

type Expense = {
  id: number;
  amount: number;
  date: string;
  category: string;
  description?: string | null;
  accountId?: number | null;
};

type Account = {
  id: number;
  name: string;
  type: "BANK" | "CASH" | "CRYPTO" | "OTHER";
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

const moneyPosition = (currency: Currency) =>
  currency === "ALL" ? "after" : "before";

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [settings, setSettings] = useState<SettingsResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editError, setEditError] = useState("");

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editCategory, setEditCategory] = useState("Food");
  const [editDescription, setEditDescription] = useState("");
  const [editAccountId, setEditAccountId] = useState<number | "">("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState("");
  const [paidFromFilter, setPaidFromFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [expensesRes, accountsRes, ratesRes, settingsRes] = await Promise.all([
        api.get("/expenses"),
        api.get("/accounts"),
        api.get("/accounts/exchange-rates"),
        api.get<SettingsResponse>("/users/me/settings"),
      ]);

      setExpenses(expensesRes.data.expenses || []);
      setAccounts(accountsRes.data.accounts || []);
      setRates(ratesRes.data.rates || null);
      setSettings(settingsRes.data || null);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showSecondCurrency = settings?.showSecondCurrency ?? true;
  const secondCurrency: Currency =
    settings?.secondCurrency && settings.secondCurrency !== settings.totalsMainCurrency
      ? settings.secondCurrency
      : settings?.totalsMainCurrency === "ALL"
      ? "EUR"
      : "ALL";

  const getAccountById = (accountId?: number | null) => {
    if (!accountId) return null;
    return accounts.find((acc) => acc.id === accountId) || null;
  };

  const getAccountName = (accountId?: number | null) => {
    const account = getAccountById(accountId);
    return account ? account.name : "—";
  };

  const formatExpenseAmount = (expense: Expense) => {
    const account = getAccountById(expense.accountId);
    const currency = account?.baseCurrency || "EUR";
    return formatMoney(expense.amount, currency, moneyPosition(currency));
  };

  const formatConvertedExpenseAmount = (expense: Expense) => {
    if (!rates || !showSecondCurrency) return null;

    const account = getAccountById(expense.accountId);
    const sourceCurrency = account?.baseCurrency || "EUR";

    if (sourceCurrency === secondCurrency) return null;

    const converted = convertAmount(expense.amount, sourceCurrency, secondCurrency, rates);
    return formatMoney(converted, secondCurrency, moneyPosition(secondCurrency));
  };

  const categoryOptions = useMemo(() => {
    return Array.from(
      new Set(
        expenses
          .map((expense) => expense.category?.trim())
          .filter(Boolean)
          .sort((a, b) => a!.localeCompare(b!))
      )
    ) as string[];
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesCategory = !categoryFilter || expense.category === categoryFilter;
      const matchesPaidFrom =
        !paidFromFilter || String(expense.accountId ?? "") === paidFromFilter;
      const expenseDate = expense.date.slice(0, 10);
      const matchesDate = !dateFilter || expenseDate === dateFilter;

      return matchesCategory && matchesPaidFrom && matchesDate;
    });
  }, [expenses, categoryFilter, paidFromFilter, dateFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!amount || !date || !category) {
      setError("Please fill amount, date and category");
      return;
    }

    if (!selectedAccountId) {
      setError("Please select the account/resource");
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/expenses", {
        amount: Number(amount),
        date,
        category,
        description: description || undefined,
        accountId: selectedAccountId,
      });

      setAmount("");
      setDate("");
      setCategory("Food");
      setDescription("");
      setSelectedAccountId("");

      await fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to create expense");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateForInput = (value: string) => {
    const d = new Date(value);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setEditAmount(String(expense.amount));
    setEditDate(formatDateForInput(expense.date));
    setEditCategory(expense.category);
    setEditDescription(expense.description || "");
    setEditAccountId(expense.accountId ?? "");
    setEditError("");
  };

  const closeEditModal = () => {
    setEditingExpense(null);
    setEditAmount("");
    setEditDate("");
    setEditCategory("Food");
    setEditDescription("");
    setEditAccountId("");
    setEditError("");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");

    if (!editingExpense) return;

    if (!editAmount || !editDate || !editCategory) {
      setEditError("Please fill amount, date and category");
      return;
    }

    if (!editAccountId) {
      setEditError("Please select the account/resource");
      return;
    }

    try {
      setEditSubmitting(true);

      await api.put(`/expenses/${editingExpense.id}`, {
        amount: Number(editAmount),
        date: editDate,
        category: editCategory,
        description: editDescription || undefined,
        accountId: editAccountId,
      });

      closeEditModal();
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setEditError(err.response?.data?.error || "Failed to update expense");
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-rose-100 p-2.5 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
            <Receipt className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Expenses
          </h1>
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
          Track spending and edit transactions while keeping balances synced.
        </p>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-2xl bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Add New Expense
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Record daily spending and choose which account paid for it.
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
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Amount
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="25.00"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
            >
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Shopping">Shopping</option>
              <option value="Bills">Bills</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Subscriptions">Subscriptions</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="xl:col-span-1">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Description
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Groceries, Uber, etc."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
            />
          </div>

          <div className="xl:col-span-1">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Paid From
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) =>
                setSelectedAccountId(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
            >
              <option value="">Select account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.baseCurrency})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 dark:disabled:bg-blue-900/40"
            >
              <Plus className="h-4 w-4" />
              {submitting ? "Adding..." : "Add expense"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-2xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Recent Expenses
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Review transactions and edit incorrect entries.
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-slate-200 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Filter className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
              Filters
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
              >
                <option value="">All categories</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Paid From
              </label>
              <select
                value={paidFromFilter}
                onChange={(e) => setPaidFromFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
              >
                <option value="">All accounts</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={String(acc.id)}>
                    {acc.name} ({acc.baseCurrency})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Date
              </label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {filteredExpenses.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {expenses.length}
              </span>{" "}
              expenses
            </p>
            <button
              type="button"
              onClick={() => {
                setCategoryFilter("");
                setPaidFromFilter("");
                setDateFilter("");
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
              Clear filters
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">Loading...</p>
        ) : filteredExpenses.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No expenses match the selected filters.
          </p>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full text-left">
                <thead className="border-b border-slate-200 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Description</th>
                    <th className="py-3 pr-4 font-medium">Amount</th>
                    <th className="py-3 pr-4 font-medium">Category</th>
                    <th className="py-3 pr-4 font-medium">Paid From</th>
                    <th className="py-3 pr-4 font-medium">Date</th>
                    <th className="py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((exp) => {
                    const converted = formatConvertedExpenseAmount(exp);

                    return (
                      <tr
                        key={exp.id}
                        className="border-b border-slate-100 last:border-b-0 dark:border-slate-800"
                      >
                        <td className="py-4 pr-4 text-slate-900 dark:text-slate-100">
                          {exp.description || "-"}
                        </td>
                        <td className="py-4 pr-4 font-semibold text-slate-900 dark:text-slate-100">
                          <p>{formatExpenseAmount(exp)}</p>
                          {converted && (
                            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                              {converted}
                            </p>
                          )}
                        </td>
                        <td className="py-4 pr-4 text-slate-700 dark:text-slate-300">
                          {exp.category}
                        </td>
                        <td className="py-4 pr-4 text-slate-700 dark:text-slate-300">
                          {getAccountName(exp.accountId)}
                        </td>
                        <td className="py-4 pr-4 text-slate-700 dark:text-slate-300">
                          {new Date(exp.date).toLocaleDateString()}
                        </td>
                        <td className="py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openEditModal(exp)}
                            className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:hidden">
              {filteredExpenses.map((exp) => {
                const converted = formatConvertedExpenseAmount(exp);

                return (
                  <div
                    key={exp.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          {exp.description || "No description"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {exp.category}
                        </p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          {formatExpenseAmount(exp)}
                        </p>
                        {converted && (
                          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                            {converted}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Paid From</p>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {getAccountName(exp.accountId)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Date</p>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {new Date(exp.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openEditModal(exp)}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
                    Edit Expense
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Update the expense and keep balances synced.
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
                  Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Date
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                >
                  <option value="Food">Food</option>
                  <option value="Transport">Transport</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Bills">Bills</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Subscriptions">Subscriptions</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Paid From
                </label>
                <div className="relative">
                  <Wallet className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <select
                    value={editAccountId}
                    onChange={(e) =>
                      setEditAccountId(e.target.value ? Number(e.target.value) : "")
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                  >
                    <option value="">Select account</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.baseCurrency})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-end gap-3 md:col-span-2 xl:col-span-1">
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
    </div>
  );
}