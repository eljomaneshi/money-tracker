import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Download,
  Filter,
  Pencil,
  Plus,
  Receipt,
  Save,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../lib/api";
import { formatMoney } from "../utils/formatMoney";

type Currency = "EUR" | "ALL" | "GBP" | "USD";

type InlineAccount = {
  id: number;
  name: string;
  baseCurrency: Currency;
};

type Expense = {
  id: number;
  amount: number;
  date: string;
  category: string;
  description?: string | null;
  accountId?: number | null;
  account?: InlineAccount | null;
};

type AccountActionType = "DEPOSIT" | "WITHDRAWAL" | "TRANSFER_OUT" | "TRANSFER_IN";

type AccountAction = {
  id: number;
  accountId: number;
  toAccountId?: number | null;
  type: AccountActionType;
  amount: number;
  description?: string | null;
  date: string;
  account?: InlineAccount | null;
  toAccount?: InlineAccount | null;
};

type ActivityItem =
  | { itemType: "EXPENSE"; data: Expense }
  | { itemType: "ACCOUNT_ACTION"; data: AccountAction };

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

const DATE_PRESETS = [
  { key: "", label: "All time" },
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "this_month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "custom", label: "Custom range" },
];

const TYPE_OPTIONS = [
  { key: "EXPENSE", label: "Expenses", active: "bg-rose-600 border-rose-600 text-white", dot: "bg-rose-500" },
  { key: "SUBSCRIPTION", label: "Subscriptions", active: "bg-violet-600 border-violet-600 text-white", dot: "bg-violet-500" },
  { key: "DEPOSIT", label: "Deposits", active: "bg-emerald-600 border-emerald-600 text-white", dot: "bg-emerald-500" },
  { key: "WITHDRAWAL", label: "Withdrawals", active: "bg-amber-500 border-amber-500 text-white", dot: "bg-amber-500" },
  { key: "TRANSFER_OUT", label: "Transfers out", active: "bg-blue-600 border-blue-600 text-white", dot: "bg-blue-500" },
  { key: "TRANSFER_IN", label: "Transfers in", active: "bg-cyan-600 border-cyan-600 text-white", dot: "bg-cyan-500" },
];

const convertAmount = (amount: number, from: Currency, to: Currency, rates: ExchangeRates) => {
  if (from === to) return amount;
  const fromRate = from === "EUR" ? 1 : rates[from];
  const toRate = to === "EUR" ? 1 : rates[to];
  if (!Number.isFinite(amount) || !Number.isFinite(fromRate) || !Number.isFinite(toRate) || fromRate <= 0 || toRate <= 0) return 0;
  const amountInEur = from === "EUR" ? amount : amount / fromRate;
  return to === "EUR" ? amountInEur : amountInEur * toRate;
};

const moneyPosition = (currency: Currency) => (currency === "ALL" ? "after" : "before");

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40";

const filterInputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40";

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accountActions, setAccountActions] = useState<AccountAction[]>([]);
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
  const [datePreset, setDatePreset] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [expensesRes, accountsRes, ratesRes, settingsRes, actionsRes] = await Promise.all([
        api.get("/expenses"),
        api.get("/accounts"),
        api.get("/accounts/exchange-rates"),
        api.get<SettingsResponse>("/users/me/settings"),
        api.get("/account-actions"),
      ]);
      setExpenses(expensesRes.data.expenses || []);
      setAccounts(accountsRes.data.accounts || []);
      setRates(ratesRes.data.rates || null);
      setSettings(settingsRes.data || null);
      setAccountActions(actionsRes.data.actions || []);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const mainCurrency: Currency = settings?.totalsMainCurrency || "ALL";
  const showSecondCurrency = settings?.showSecondCurrency ?? true;
  const secondCurrency: Currency =
    settings?.secondCurrency && settings.secondCurrency !== settings.totalsMainCurrency
      ? settings.secondCurrency
      : settings?.totalsMainCurrency === "ALL" ? "EUR" : "ALL";

  const getAccountById = (accountId?: number | null, inline?: InlineAccount | null) => {
    if (!accountId) return inline || null;
    return accounts.find((acc) => acc.id === accountId) || inline || null;
  };

  const getAccountName = (accountId?: number | null, inline?: InlineAccount | null) => {
    const account = getAccountById(accountId, inline);
    return account ? account.name : "—";
  };

  const formatExpenseAmount = (expense: Expense) => {
    const account = getAccountById(expense.accountId, expense.account);
    const currency = account?.baseCurrency || "EUR";
    return formatMoney(expense.amount, currency, moneyPosition(currency));
  };

  const formatConvertedExpenseAmount = (expense: Expense) => {
    if (!rates || !showSecondCurrency) return null;
    const account = getAccountById(expense.accountId, expense.account);
    const sourceCurrency = account?.baseCurrency || "EUR";
    if (sourceCurrency === secondCurrency) return null;
    const converted = convertAmount(expense.amount, sourceCurrency, secondCurrency, rates);
    return formatMoney(converted, secondCurrency, moneyPosition(secondCurrency));
  };

  const getActionLabel = (type: AccountActionType) => {
    switch (type) {
      case "DEPOSIT": return "Deposit";
      case "WITHDRAWAL": return "Withdrawal";
      case "TRANSFER_OUT": return "Transfer out";
      case "TRANSFER_IN": return "Transfer in";
      default: return "Action";
    }
  };

  const getActivityAmount = (item: ActivityItem) => {
    if (item.itemType === "EXPENSE") return formatExpenseAmount(item.data);
    const action = item.data;
    const account = getAccountById(action.accountId, action.account);
    const currency = account?.baseCurrency || "EUR";
    return formatMoney(action.amount, currency, moneyPosition(currency));
  };

  const getConvertedActivityAmount = (item: ActivityItem) => {
    if (!rates || !showSecondCurrency) return null;
    if (item.itemType === "EXPENSE") return formatConvertedExpenseAmount(item.data);
    const action = item.data;
    const account = getAccountById(action.accountId, action.account);
    const sourceCurrency = account?.baseCurrency || "EUR";
    if (sourceCurrency === secondCurrency) return null;
    const converted = convertAmount(action.amount, sourceCurrency, secondCurrency, rates);
    return formatMoney(converted, secondCurrency, moneyPosition(secondCurrency));
  };

  const categoryOptions = useMemo(() => {
    return Array.from(
      new Set(expenses.map((e) => e.category?.trim()).filter(Boolean).sort((a, b) => a!.localeCompare(b!)))
    ) as string[];
  }, [expenses]);

  const activityItems = useMemo<ActivityItem[]>(() => {
    const expenseItems: ActivityItem[] = expenses.map((expense) => ({ itemType: "EXPENSE", data: expense }));
    const actionItems: ActivityItem[] = accountActions.map((action) => ({ itemType: "ACCOUNT_ACTION", data: action }));
    return [...expenseItems, ...actionItems].sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());
  }, [expenses, accountActions]);

  const dateRange = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    switch (datePreset) {
      case "today": return { from: todayStart, to: todayEnd };
      case "yesterday": {
        const from = new Date(todayStart); from.setDate(from.getDate() - 1);
        const to = new Date(from); to.setHours(23, 59, 59, 999);
        return { from, to };
      }
      case "this_month": return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: todayEnd };
      case "last_month": return {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
      };
      case "custom": return {
        from: dateFrom ? new Date(dateFrom + "T00:00:00") : null,
        to: dateTo ? new Date(dateTo + "T23:59:59") : null,
      };
      default: return { from: null, to: null };
    }
  }, [datePreset, dateFrom, dateTo]);

  const toggleType = (key: string) => {
    setSelectedTypes((prev) => prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]);
  };

  const filteredActivity = useMemo(() => {
    return activityItems.filter((item) => {
      const itemDate = new Date(item.data.date);
      let matchesDate = true;
      if (dateRange.from && dateRange.to) {
        matchesDate = itemDate >= dateRange.from && itemDate <= dateRange.to;
      }
      if (item.itemType === "EXPENSE") {
        const expense = item.data;
        const matchesCategory = !categoryFilter || expense.category === categoryFilter;
        const matchesPaidFrom = !paidFromFilter || String(expense.accountId ?? "") === paidFromFilter;
        const typeKey = expense.category === "Subscriptions" ? "SUBSCRIPTION" : "EXPENSE";
        const matchesType = selectedTypes.length === 0 || selectedTypes.includes(typeKey);
        return matchesDate && matchesCategory && matchesPaidFrom && matchesType;
      }
      const action = item.data;
      const matchesAccount =
        !paidFromFilter ||
        String(action.accountId) === paidFromFilter ||
        String(action.toAccountId ?? "") === paidFromFilter;
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(action.type);
      return matchesDate && matchesAccount && matchesType;
    });
  }, [activityItems, categoryFilter, paidFromFilter, dateRange, selectedTypes]);

  const totals = useMemo(() => {
    if (!rates) return { expenses: 0, deposits: 0, withdrawals: 0, transfersOut: 0 };
    let expensesTotal = 0, depositsTotal = 0, withdrawalsTotal = 0, transfersOutTotal = 0;
    filteredActivity.forEach((item) => {
      if (item.itemType === "EXPENSE") {
        const acc = getAccountById(item.data.accountId, item.data.account);
        expensesTotal += convertAmount(item.data.amount, acc?.baseCurrency || "EUR", mainCurrency, rates);
      } else {
        const action = item.data;
        const acc = getAccountById(action.accountId, action.account);
        const converted = convertAmount(action.amount, acc?.baseCurrency || "EUR", mainCurrency, rates);
        if (action.type === "DEPOSIT") depositsTotal += converted;
        else if (action.type === "WITHDRAWAL") withdrawalsTotal += converted;
        else if (action.type === "TRANSFER_OUT") transfersOutTotal += converted;
      }
    });
    return { expenses: expensesTotal, deposits: depositsTotal, withdrawals: withdrawalsTotal, transfersOut: transfersOutTotal };
  }, [filteredActivity, rates, mainCurrency]);

  const netCashflow = totals.deposits - totals.expenses - totals.withdrawals;

  const activeFilterCount = [categoryFilter, paidFromFilter, datePreset, ...selectedTypes].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

  const clearFilters = () => {
    setCategoryFilter("");
    setPaidFromFilter("");
    setDatePreset("");
    setDateFrom("");
    setDateTo("");
    setSelectedTypes([]);
  };

  const getActiveDateLabel = () => {
    if (!datePreset) return "All time";
    if (datePreset === "today") return "Today";
    if (datePreset === "yesterday") return "Yesterday";
    if (datePreset === "this_month") return "This month";
    if (datePreset === "last_month") return "Last month";
    if (datePreset === "custom") {
      if (dateFrom && dateTo) return dateFrom + " to " + dateTo;
      if (dateFrom) return "From " + dateFrom;
      if (dateTo) return "Until " + dateTo;
      return "Custom range";
    }
    return "All time";
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const pos = moneyPosition(mainCurrency);
    const generatedAt = new Date().toLocaleString();
    const userName = settings?.fullName || "";
    const userEmail = settings?.email || "";

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 138);
    doc.text("Money Tracker", 14, 16);

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text("Activity Report", 14, 23);

    doc.setDrawColor(200, 210, 235);
    doc.setLineWidth(0.5);
    doc.line(14, 27, 196, 27);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text("Generated: " + generatedAt, 14, 33);
    doc.text("User: " + (userName ? userName + "  |  " : "") + userEmail, 14, 39);

    const filterParts: string[] = ["Date: " + getActiveDateLabel()];
    if (paidFromFilter) {
      const acc = accounts.find((a) => String(a.id) === paidFromFilter);
      if (acc) filterParts.push("Account: " + acc.name + " (" + acc.baseCurrency + ")");
    }
    if (categoryFilter) filterParts.push("Category: " + categoryFilter);
    if (selectedTypes.length > 0) {
      const labels = selectedTypes.map((k) => TYPE_OPTIONS.find((o) => o.key === k)?.label || k);
      filterParts.push("Types: " + labels.join(", "));
    }
    doc.text("Filters: " + filterParts.join("   |   "), 14, 45);

    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 14, 56);

    const cashflowSign = netCashflow >= 0 ? "+" : "-";
    const cashflowFormatted = cashflowSign + formatMoney(Math.abs(netCashflow), mainCurrency as Currency, pos);

    const summaryRows = [
      ["Total Expenses", formatMoney(totals.expenses, mainCurrency as Currency, pos)],
      ["Total Deposits", formatMoney(totals.deposits, mainCurrency as Currency, pos)],
      ["Total Withdrawals", formatMoney(totals.withdrawals, mainCurrency as Currency, pos)],
      ["Net Cashflow (deposits - expenses - withdrawals)", cashflowFormatted],
      ["Transfers Out (between own accounts, not included in cashflow)", formatMoney(totals.transfersOut, mainCurrency as Currency, pos)],
    ];

    autoTable(doc, {
      startY: 60,
      head: [["Metric", "Amount (" + mainCurrency + ")"]],
      body: summaryRows,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 58, 138], fontStyle: "bold", halign: "left" },
      columnStyles: {
        0: { halign: "left", cellWidth: 130 },
        1: { halign: "right", cellWidth: 50 },
      },
      margin: { left: 14, right: 14 },
    });

    const tableBody = filteredActivity.map((item) => {
      if (item.itemType === "EXPENSE") {
        const exp = item.data;
        const acc = getAccountById(exp.accountId, exp.account);
        return [
          exp.description || "-",
          formatExpenseAmount(exp),
          exp.category === "Subscriptions" ? "Subscription" : "Expense",
          acc ? acc.name + " (" + acc.baseCurrency + ")" : "-",
          new Date(exp.date).toLocaleDateString(),
        ];
      }
      const action = item.data;
      const isTransfer = action.type === "TRANSFER_OUT" || action.type === "TRANSFER_IN";
      const accountDisplay = isTransfer
        ? getAccountName(action.accountId, action.account) + " > " + getAccountName(action.toAccountId, action.toAccount)
        : (() => {
          const acc = getAccountById(action.accountId, action.account);
          return acc ? acc.name + " (" + acc.baseCurrency + ")" : "-";
        })();
      const acc = getAccountById(action.accountId, action.account);
      const currency = acc?.baseCurrency || "EUR";
      return [
        action.description || getActionLabel(action.type),
        formatMoney(action.amount, currency as Currency, moneyPosition(currency as Currency)),
        getActionLabel(action.type),
        accountDisplay,
        new Date(action.date).toLocaleDateString(),
      ];
    });

    const finalY = (doc as any).lastAutoTable?.finalY ?? 110;

    autoTable(doc, {
      startY: finalY + 10,
      head: [["Description", "Amount", "Type", "Account", "Date"]],
      body: tableBody,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246], fontStyle: "bold" },
      columnStyles: {
        0: { halign: "left" },
        1: { halign: "right", cellWidth: 28 },
        2: { halign: "left", cellWidth: 28 },
        3: { halign: "left" },
        4: { halign: "right", cellWidth: 22 },
      },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      margin: { left: 14, right: 14 },
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(160);
      doc.text(
        "Page " + i + " of " + pageCount + "   |   Money Tracker   |   " + generatedAt,
        14,
        doc.internal.pageSize.getHeight() - 8
      );
    }

    doc.save("activity-" + new Date().toISOString().slice(0, 10) + ".pdf");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!amount || !date || !category) { setError("Please fill amount, date and category"); return; }
    if (!selectedAccountId) { setError("Please select the account/resource"); return; }
    try {
      setSubmitting(true);
      await api.post("/expenses", { amount: Number(amount), date, category, description: description || undefined, accountId: selectedAccountId });
      setAmount(""); setDate(""); setCategory("Food"); setDescription(""); setSelectedAccountId("");
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create expense");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateForInput = (value: string) => {
    const d = new Date(value);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
    setEditAmount(""); setEditDate(""); setEditCategory("Food"); setEditDescription(""); setEditAccountId("");
    setEditError("");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    if (!editingExpense) return;
    if (!editAmount || !editDate || !editCategory) { setEditError("Please fill amount, date and category"); return; }
    if (!editAccountId) { setEditError("Please select the account/resource"); return; }
    try {
      setEditSubmitting(true);
      await api.put(`/expenses/${editingExpense.id}`, {
        amount: Number(editAmount), date: editDate, category: editCategory,
        description: editDescription || undefined, accountId: editAccountId,
      });
      closeEditModal();
      await fetchData();
    } catch (err: any) {
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
            Activity
          </h1>
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
          Track expenses, subscription charges, deposits, withdrawals, and transfers in one place.
        </p>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-2xl bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Add New Expense</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Record daily spending and choose which account paid for it.</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Amount</label>
            <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="25.00" className={inputClass} />
          </div>
          <div className="min-w-0 overflow-hidden">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`block min-w-0 max-w-full ${inputClass}`} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
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
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Groceries, Uber, etc." className={inputClass} />
          </div>
          <div className="xl:col-span-1">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Paid From</label>
            <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value ? Number(e.target.value) : "")} className={inputClass}>
              <option value="">Select account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name} ({acc.baseCurrency})</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 dark:disabled:bg-blue-900/40">
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
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Recent Activity</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review your latest financial activity across expenses and balance actions.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                    {activeFilterCount} active
                  </span>
                )}
              </div>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Reset all
              </button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Category</label>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={filterInputClass}>
                <option value="">All categories</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Account</label>
              <select value={paidFromFilter} onChange={(e) => setPaidFromFilter(e.target.value)} className={filterInputClass}>
                <option value="">All accounts</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={String(acc.id)}>{acc.name} ({acc.baseCurrency})</option>
                ))}
              </select>
            </div>
          </div>

          <SectionDivider label="Date range" />

          <div className="flex flex-wrap gap-2">
            {DATE_PRESETS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setDatePreset(key)}
                className={`rounded-xl border px-3.5 py-1.5 text-sm font-medium transition-all ${datePreset === key
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {datePreset === "custom" && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="min-w-0 overflow-hidden">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">From</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={`block min-w-0 max-w-full ${filterInputClass}`} />
              </div>
              <div className="min-w-0 overflow-hidden">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">To</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={`block min-w-0 max-w-full ${filterInputClass}`} />
              </div>
            </div>
          )}

          <SectionDivider label="Activity type" />

          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map(({ key, label, active, dot }) => {
              const isSelected = selectedTypes.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleType(key)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-sm font-medium transition-all ${isSelected
                      ? active + " shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                >
                  {!isSelected && <span className={`h-2 w-2 rounded-full ${dot}`} />}
                  {label}
                </button>
              );
            })}
          </div>

          {rates && (
            <>
              <SectionDivider label="Totals" />
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="grid grid-cols-2 sm:grid-cols-4">
                  <div className="border-b border-r border-slate-100 p-4 dark:border-slate-800">
                    <div className="mb-2 flex items-center gap-1.5">
                      <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Expenses</span>
                    </div>
                    <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
                      {formatMoney(totals.expenses, mainCurrency, moneyPosition(mainCurrency))}
                    </p>
                  </div>

                  <div className="border-b border-slate-100 p-4 dark:border-slate-800 sm:border-r">
                    <div className="mb-2 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Deposits</span>
                    </div>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {formatMoney(totals.deposits, mainCurrency, moneyPosition(mainCurrency))}
                    </p>
                  </div>

                  <div className="border-b border-r border-slate-100 p-4 dark:border-slate-800 sm:border-b-0">
                    <div className="mb-2 flex items-center gap-1.5">
                      <Wallet className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Net cashflow</span>
                    </div>
                    <p className={`text-lg font-bold ${netCashflow >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {netCashflow >= 0 ? "+" : "\u2212"}
                      {formatMoney(Math.abs(netCashflow), mainCurrency, moneyPosition(mainCurrency))}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">excl. transfers</p>
                  </div>

                  <div className="p-4">
                    <div className="mb-2 flex items-center gap-1.5">
                      <ArrowLeftRight className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Transfers</span>
                    </div>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {formatMoney(totals.transfersOut, mainCurrency, moneyPosition(mainCurrency))}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">between own accounts</p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">{filteredActivity.length}</span>{" "}
              of{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">{activityItems.length}</span>{" "}
              activity items
            </p>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear filters
                </button>
              )}
              <button
                type="button"
                onClick={exportPDF}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 shadow-sm shadow-blue-200 dark:shadow-none"
              >
                <Download className="h-3.5 w-3.5" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-slate-400 dark:text-slate-500">Loading...</p>
        ) : filteredActivity.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">No activity matches the selected filters.</p>
        ) : (
          <>
            <div className="mt-6 hidden overflow-x-auto lg:block">
              <table className="min-w-full text-left">
                <thead className="border-b border-slate-200 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Description</th>
                    <th className="py-3 pr-4 font-medium">Amount</th>
                    <th className="py-3 pr-4 font-medium">Type</th>
                    <th className="py-3 pr-4 font-medium">Account</th>
                    <th className="py-3 pr-4 font-medium">Date</th>
                    <th className="py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivity.map((item) => {
                    const converted = getConvertedActivityAmount(item);

                    if (item.itemType === "EXPENSE") {
                      const exp = item.data;
                      return (
                        <tr key={`expense-${exp.id}`} className="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
                          <td className="py-4 pr-4 text-slate-900 dark:text-slate-100">{exp.description || "-"}</td>
                          <td className="py-4 pr-4 font-semibold text-rose-600 dark:text-rose-400">
                            <p>{formatExpenseAmount(exp)}</p>
                            {converted && <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{converted}</p>}
                          </td>
                          <td className="py-4 pr-4 text-slate-700 dark:text-slate-300">
                            {exp.category === "Subscriptions" ? "Subscription payment" : "Expense"}
                          </td>
                          <td className="py-4 pr-4 text-slate-700 dark:text-slate-300">{getAccountName(exp.accountId, exp.account)}</td>
                          <td className="py-4 pr-4 text-slate-700 dark:text-slate-300">{new Date(exp.date).toLocaleDateString()}</td>
                          <td className="py-4 text-right">
                            <button type="button" onClick={() => openEditModal(exp)} className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600">
                              <Pencil className="h-4 w-4" />
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    const action = item.data;
                    const source = getAccountName(action.accountId, action.account);
                    const target = getAccountName(action.toAccountId, action.toAccount);
                    const amountColor =
                      action.type === "DEPOSIT" ? "text-emerald-600 dark:text-emerald-400"
                        : action.type === "WITHDRAWAL" ? "text-rose-600 dark:text-rose-400"
                          : "text-blue-600 dark:text-blue-400";

                    return (
                      <tr key={`action-${action.id}`} className="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
                        <td className="py-4 pr-4 text-slate-900 dark:text-slate-100">{action.description || getActionLabel(action.type)}</td>
                        <td className={`py-4 pr-4 font-semibold ${amountColor}`}>
                          <p>{getActivityAmount(item)}</p>
                          {converted && <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{converted}</p>}
                        </td>
                        <td className="py-4 pr-4 text-slate-700 dark:text-slate-300">{getActionLabel(action.type)}</td>
                        <td className="py-4 pr-4 text-slate-700 dark:text-slate-300">
                          {action.type === "TRANSFER_OUT" || action.type === "TRANSFER_IN" ? `${source} \u2192 ${target}` : source}
                        </td>
                        <td className="py-4 pr-4 text-slate-700 dark:text-slate-300">{new Date(action.date).toLocaleDateString()}</td>
                        <td className="py-4 text-right">
                          <span className="text-sm text-slate-400 dark:text-slate-500">—</span>
                        </td>                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 lg:hidden">
              {filteredActivity.map((item) => {
                const converted = getConvertedActivityAmount(item);

                if (item.itemType === "EXPENSE") {
                  const exp = item.data;
                  return (
                    <div key={`expense-${exp.id}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{exp.description || "No description"}</p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{exp.category === "Subscriptions" ? "Subscription payment" : exp.category}</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{formatExpenseAmount(exp)}</p>
                          {converted && <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{converted}</p>}
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-slate-500 dark:text-slate-400">Account</p>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{getAccountName(exp.accountId, exp.account)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 dark:text-slate-400">Date</p>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{new Date(exp.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => openEditModal(exp)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-600">
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                    </div>
                  );
                }

                const action = item.data;
                const amountColor =
                  action.type === "DEPOSIT" ? "text-emerald-600 dark:text-emerald-400"
                    : action.type === "WITHDRAWAL" ? "text-rose-600 dark:text-rose-400"
                      : "text-blue-600 dark:text-blue-400";

                return (
                  <div key={`action-${action.id}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-blue-100 p-2.5 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                          <ArrowLeftRight className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{action.description || getActionLabel(action.type)}</p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{getActionLabel(action.type)}</p>
                        </div>
                      </div>
                      <div>
                        <p className={`text-lg font-bold ${amountColor}`}>{getActivityAmount(item)}</p>
                        {converted && <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{converted}</p>}
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Account</p>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {action.type === "TRANSFER_OUT" || action.type === "TRANSFER_IN"
                            ? `${getAccountName(action.accountId, action.account)} \u2192 ${getAccountName(action.toAccountId, action.toAccount)}`
                            : getAccountName(action.accountId, action.account)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Date</p>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{new Date(action.date).toLocaleDateString()}</p>
                      </div>
                    </div>
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
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">Edit Expense</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Update the expense and keep balances synced.</p>
                </div>
              </div>
              <button type="button" onClick={closeEditModal} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                <X className="h-4 w-4" />
                Close
              </button>
            </div>

            {editError && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Amount</label>
                <input type="number" min="0" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className={inputClass} />
              </div>
              <div className="min-w-0 overflow-hidden">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className={`block min-w-0 max-w-full ${inputClass}`} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className={inputClass}>
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
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                <input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Paid From</label>
                <div className="relative">
                  <Wallet className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <select value={editAccountId} onChange={(e) => setEditAccountId(e.target.value ? Number(e.target.value) : "")} className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40">
                    <option value="">Select account</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({acc.baseCurrency})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-end gap-3 md:col-span-2 xl:col-span-1">
                <button type="button" onClick={closeEditModal} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button type="submit" disabled={editSubmitting} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 dark:disabled:bg-blue-900/40">
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
