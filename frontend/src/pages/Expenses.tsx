import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Receipt } from "lucide-react";
import api from "../lib/api";
import { formatMoney, convertAmount, type Currency, type ExchangeRates } from "../utils/formatMoney";
import {
  ExpenseFilters,
  type AccountOption,
  TYPE_OPTIONS,
} from "../components/activity/ExpenseFilters";
import {
  ActivityLedgerTable,
  type ActivityItem,
  type ExpenseItem,
  type AccountActionItem,
  type AccountActionType,
  type InlineAccount,
} from "../components/activity/ActivityLedgerTable";
import { EditExpenseDialog } from "../components/activity/EditExpenseDialog";
import { Button, Card, EmptyState, Input, Select, Skeleton } from "../components/ui";

type Account = {
  id: number;
  name: string;
  type: "BANK" | "CASH" | "CRYPTO" | "OTHER";
  balance: number;
  baseCurrency: Currency;
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

const moneyPosition = (currency: Currency) => (currency === "ALL" ? "after" : "before");

export default function Expenses() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [accountActions, setAccountActions] = useState<AccountActionItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [settings, setSettings] = useState<SettingsResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editError, setEditError] = useState("");

  const amountInputRef = useRef<HTMLInputElement>(null);

  // New expense form state
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);

  // Edit expense state
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState("");
  const [paidFromFilter, setPaidFromFilter] = useState("");
  const [datePreset, setDatePreset] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

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

  useEffect(() => {
    fetchData();
  }, []);

  const mainCurrency: Currency = settings?.totalsMainCurrency || "ALL";
  const showSecondCurrency = settings?.showSecondCurrency ?? true;
  const secondCurrency: Currency =
    settings?.secondCurrency && settings.secondCurrency !== settings.totalsMainCurrency
      ? settings.secondCurrency
      : settings?.totalsMainCurrency === "ALL"
      ? "EUR"
      : "ALL";

  const getAccountById = (accountId?: number | null, inline?: InlineAccount | null) => {
    if (!accountId) return inline || null;
    return accounts.find((acc) => acc.id === accountId) || inline || null;
  };

  const getAccountName = (accountId?: number | null, inline?: InlineAccount | null) => {
    const account = getAccountById(accountId, inline);
    return account ? account.name : "—";
  };

  const formatExpenseAmount = (expense: ExpenseItem) => {
    const account = getAccountById(expense.accountId, expense.account);
    const currency = account?.baseCurrency || "EUR";
    return formatMoney(expense.amount, currency, moneyPosition(currency));
  };

  const formatConvertedExpenseAmount = (expense: ExpenseItem) => {
    if (!rates || !showSecondCurrency) return null;
    const account = getAccountById(expense.accountId, expense.account);
    const sourceCurrency = account?.baseCurrency || "EUR";
    if (sourceCurrency === secondCurrency) return null;
    const converted = convertAmount(expense.amount, sourceCurrency, secondCurrency, rates);
    return formatMoney(converted, secondCurrency, moneyPosition(secondCurrency));
  };

  const getActionLabel = (type: AccountActionType) => {
    switch (type) {
      case "DEPOSIT":
        return "Deposit";
      case "WITHDRAWAL":
        return "Withdrawal";
      case "TRANSFER_OUT":
        return "Transfer out";
      case "TRANSFER_IN":
        return "Transfer in";
      default:
        return "Action";
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
      new Set(expenses.map((e) => e.category?.trim()).filter(Boolean).sort((a, b) => a.localeCompare(b)))
    ) as string[];
  }, [expenses]);

  const activityItems = useMemo<ActivityItem[]>(() => {
    const expenseItems: ActivityItem[] = expenses.map((expense) => ({ itemType: "EXPENSE", data: expense }));
    const actionItems: ActivityItem[] = accountActions.map((action) => ({ itemType: "ACCOUNT_ACTION", data: action }));
    return [...expenseItems, ...actionItems].sort(
      (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
    );
  }, [expenses, accountActions]);

  const dateRange = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    switch (datePreset) {
      case "today":
        return { from: todayStart, to: todayEnd };
      case "yesterday": {
        const from = new Date(todayStart);
        from.setDate(from.getDate() - 1);
        const to = new Date(from);
        to.setHours(23, 59, 59, 999);
        return { from, to };
      }
      case "this_month":
        return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: todayEnd };
      case "last_month":
        return {
          from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
        };
      case "custom":
        return {
          from: dateFrom ? new Date(dateFrom + "T00:00:00") : null,
          to: dateTo ? new Date(dateTo + "T23:59:59") : null,
        };
      default:
        return { from: null, to: null };
    }
  }, [datePreset, dateFrom, dateTo]);

  const toggleType = (key: string) => {
    setSelectedTypes((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    );
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

  const PAGE_SIZE = 25;
  const [currentPage, setCurrentPage] = useState(1);
  const filterKey = `${categoryFilter}|${paidFromFilter}|${datePreset}|${dateFrom}|${dateTo}|${selectedTypes.join(",")}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);

  // Reset to page 1 whenever any filter changes (adjusted during render to avoid cascading renders)
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filteredActivity.length / PAGE_SIZE));

  // Clamp current page if total filtered items shrink (e.g. after editing/deleting)
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }

  const paginatedActivity = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredActivity.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredActivity, currentPage]);

  const pageStartItem =
    filteredActivity.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEndItem = Math.min(currentPage * PAGE_SIZE, filteredActivity.length);

  const totals = useMemo(() => {
    if (!rates) return { expenses: 0, deposits: 0, withdrawals: 0, transfersOut: 0 };
    let expensesTotal = 0;
    let depositsTotal = 0;
    let withdrawalsTotal = 0;
    let transfersOutTotal = 0;

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

    return {
      expenses: expensesTotal,
      deposits: depositsTotal,
      withdrawals: withdrawalsTotal,
      transfersOut: transfersOutTotal,
    };
  }, [filteredActivity, rates, mainCurrency, accounts]);

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

  const exportPDF = async () => {
    try {
      setIsExportingPdf(true);
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

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
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!amount || !date || !category) {
      setError("Please fill amount, date, and category.");
      return;
    }
    if (!selectedAccountId) {
      setError("Please select the paying account.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/expenses", {
        amount: Number(amount),
        date,
        category,
        description: description.trim() || undefined,
        accountId: selectedAccountId,
      });

      setAmount("");
      setDate("");
      setCategory("Food");
      setDescription("");
      setSelectedAccountId("");
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSave = async (payload: {
    amount: number;
    date: string;
    category: string;
    description?: string;
    accountId: number;
  }) => {
    if (!editingExpense) return;
    try {
      setEditSubmitting(true);
      setEditError("");
      await api.put(`/expenses/${editingExpense.id}`, payload);
      setEditingExpense(null);
      await fetchData();
    } catch (err: any) {
      setEditError(err.response?.data?.error || "Failed to update expense");
    } finally {
      setEditSubmitting(false);
    }
  };

  const accountOptions: AccountOption[] = useMemo(() => {
    return accounts.map((a) => ({
      id: a.id,
      name: a.name,
      baseCurrency: a.baseCurrency,
    }));
  }, [accounts]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-rose-500/10 p-2.5 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
            <Receipt className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Activity
          </h1>
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
          Track expenses, subscription charges, deposits, withdrawals, and transfers in one unified ledger.
        </p>
      </div>

      {/* Add New Expense Section */}
      <Card padding="md">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-2xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Add New Expense
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Record daily spending and choose which account paid for it.
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleCreateExpense} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Input
            ref={amountInputRef}
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

          <Select
            label="Paid From"
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value ? Number(e.target.value) : "")}
            required
          >
            <option value="">Select account</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.baseCurrency})
              </option>
            ))}
          </Select>

          <div className="flex items-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={submitting}
              leftIcon={<Plus className="h-4 w-4" />}
              className="w-full"
            >
              Add expense
            </Button>
          </div>
        </form>
      </Card>

      {/* Filter Ledger Bar */}
      <ExpenseFilters
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        categoryOptions={categoryOptions}
        paidFromFilter={paidFromFilter}
        onPaidFromFilterChange={setPaidFromFilter}
        accounts={accountOptions}
        datePreset={datePreset}
        onDatePresetChange={setDatePreset}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        selectedTypes={selectedTypes}
        onToggleType={toggleType}
        activeFilterCount={activeFilterCount}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filteredCount={filteredActivity.length}
        totalCount={activityItems.length}
        onExportPdf={exportPDF}
        isExportingPdf={isExportingPdf}
        totals={totals}
        netCashflow={netCashflow}
        mainCurrency={mainCurrency}
        pageStartItem={pageStartItem}
        pageEndItem={pageEndItem}
      />

      {/* Ledger Content Area */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      ) : activityItems.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No activity recorded yet"
          description="Log your daily expenses, bills, or account transactions to see your financial timeline and outflow analytics."
          actionText="Log your first expense"
          actionIcon={<Plus className="h-4 w-4" />}
          onAction={() => {
            amountInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            amountInputRef.current?.focus();
          }}
          iconBg="bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"
        />
      ) : filteredActivity.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No activity matches your filters"
          description="Try adjusting your date range, categories, or transaction types to see more results."
          actionText="Clear all filters"
          onAction={clearFilters}
          iconBg="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
        />
      ) : (
        <div className="space-y-4">
          <ActivityLedgerTable
            items={paginatedActivity}
            onEditExpense={setEditingExpense}
            formatExpenseAmount={formatExpenseAmount}
            getActivityAmount={getActivityAmount}
            getConvertedActivityAmount={getConvertedActivityAmount}
            getAccountName={getAccountName}
            getActionLabel={getActionLabel}
          />

          {filteredActivity.length > 0 && totalPages > 1 && (
            <Card
              padding="sm"
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border border-slate-200/90 dark:border-white/10"
            >
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing{" "}
                <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {pageStartItem}–{pageEndItem}
                </span>{" "}
                of{" "}
                <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {filteredActivity.length}
                </span>{" "}
                activity items
              </p>

              <div
                className="flex items-center gap-2"
                role="navigation"
                aria-label="Activity Ledger Pagination"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 350, behavior: "smooth" });
                  }}
                  disabled={currentPage === 1}
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                  aria-label="Go to previous page"
                >
                  Previous
                </Button>

                <span className="px-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Page{" "}
                  <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                    {currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                    {totalPages}
                  </span>
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 350, behavior: "smooth" });
                  }}
                  disabled={currentPage >= totalPages}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                  aria-label="Go to next page"
                >
                  Next
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Edit Expense Modal Dialog */}
      <EditExpenseDialog
        isOpen={Boolean(editingExpense)}
        onClose={() => {
          setEditingExpense(null);
          setEditError("");
        }}
        expense={editingExpense}
        accounts={accountOptions}
        onSave={handleEditSave}
        isSaving={editSubmitting}
        error={editError}
      />
    </div>
  );
}
