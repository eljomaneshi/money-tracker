import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Repeat, Plus, XCircle } from "lucide-react";
import api from "../lib/api";
import { formatMoney } from "../utils/formatMoney";

type Currency = "ALL" | "EUR" | "GBP" | "USD";
type BillingPeriod = "MONTHLY" | "YEARLY";
type SubscriptionStatus = "ACTIVE" | "CANCELLED";
type AccountType = "BANK" | "CASH" | "CRYPTO" | "OTHER";

type Subscription = {
  id: number;
  name: string;
  price: number;
  billingPeriod: BillingPeriod;
  nextBillingDate: string;
  status: SubscriptionStatus;
  accountId?: number | null;
};

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

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("MONTHLY");
  const [nextBillingDate, setNextBillingDate] = useState("");
  const [accountId, setAccountId] = useState<number | "">("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [subsRes, accountsRes, ratesRes, settingsRes] = await Promise.all([
        api.get("/subscriptions"),
        api.get("/accounts"),
        api.get("/accounts/exchange-rates"),
        api.get("/users/me/settings"),
      ]);

      setSubscriptions(subsRes.data.subscriptions || []);
      setAccounts(accountsRes.data.accounts || []);
      setRates(ratesRes.data.rates || null);
      setSettings(settingsRes.data || null);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to load subscriptions");
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

  const getAccountById = (id?: number | null) =>
    accounts.find((acc) => acc.id === id);

  const getAccountName = (id?: number | null) => {
    if (!id) return "No account";
    return getAccountById(id)?.name || "Unknown account";
  };

  const formatSubscriptionPrice = (sub: Subscription) => {
    const accountCurrency = getAccountById(sub.accountId)?.baseCurrency || "EUR";
    return formatMoney(
      sub.price,
      accountCurrency,
      accountCurrency === "ALL" ? "after" : "before"
    );
  };

  const getConvertedPrice = (sub: Subscription) => {
    if (!rates) return null;

    const accountCurrency = getAccountById(sub.accountId)?.baseCurrency || "EUR";
    if (accountCurrency === secondCurrency) return null;

    const converted = convertAmount(sub.price, accountCurrency, secondCurrency, rates);

    return formatMoney(
      converted,
      secondCurrency,
      secondCurrency === "ALL" ? "after" : "before"
    );
  };

  const activeSubscriptions = useMemo(
    () => subscriptions.filter((sub) => sub.status === "ACTIVE"),
    [subscriptions]
  );

  const cancelledSubscriptions = useMemo(
    () => subscriptions.filter((sub) => sub.status === "CANCELLED"),
    [subscriptions]
  );

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !price || !nextBillingDate) {
      setError("Please fill name, price, and next billing date");
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/subscriptions", {
        name: name.trim(),
        price: Number(price),
        billingPeriod,
        nextBillingDate,
        accountId: accountId || undefined,
      });

      setName("");
      setPrice("");
      setBillingPeriod("MONTHLY");
      setNextBillingDate("");
      setAccountId("");

      await fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to create subscription");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSubscription = async (id: number) => {
    try {
      await api.put(`/subscriptions/${id}/cancel`);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to cancel subscription");
    }
  };

  const renderRows = (
    items: Subscription[],
    emptyText: string,
    showCancel: boolean
  ) => {
    if (loading) {
      return (
        <div className="px-6 py-8 text-sm text-slate-400 dark:text-slate-500">
          Loading...
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400">
          {emptyText}
        </div>
      );
    }

    return (
      <>
        <div className="hidden grid-cols-6 gap-4 border-b border-slate-200 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400 lg:grid">
          <div>Description</div>
          <div>Amount</div>
          <div>Type</div>
          <div>Account</div>
          <div>Date</div>
          <div className="text-right">Actions</div>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {items.map((sub) => {
            const converted = showSecondCurrency ? getConvertedPrice(sub) : null;

            return (
              <div key={sub.id}>
                <div className="hidden grid-cols-6 gap-4 px-6 py-5 lg:grid lg:items-center">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                      {sub.name}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatSubscriptionPrice(sub)}
                    </p>
                    {converted && (
                      <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
                        {converted}
                      </p>
                    )}
                  </div>

                  <div className="text-slate-900 dark:text-slate-100">
                    {sub.billingPeriod === "MONTHLY" ? "Monthly" : "Yearly"}
                  </div>

                  <div className="text-slate-900 dark:text-slate-100">
                    {getAccountName(sub.accountId)}
                  </div>

                  <div className="text-slate-900 dark:text-slate-100">
                    {new Date(sub.nextBillingDate).toLocaleDateString()}
                  </div>

                  <div className="flex justify-end">
                    {showCancel ? (
                      <button
                        type="button"
                        onClick={() => handleCancelSubscription(sub.id)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                      >
                        <XCircle className="h-4 w-4" />
                        Cancel
                      </button>
                    ) : (
                      <span className="text-sm text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </div>
                </div>

                <div className="space-y-4 px-5 py-5 lg:hidden">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                        {sub.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {sub.billingPeriod === "MONTHLY" ? "Monthly" : "Yearly"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatSubscriptionPrice(sub)}
                      </p>
                      {converted && (
                        <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
                          {converted}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Account</p>
                      <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                        {getAccountName(sub.accountId)}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Date</p>
                      <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                        {new Date(sub.nextBillingDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {showCancel && (
                    <button
                      type="button"
                      onClick={() => handleCancelSubscription(sub.id)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel subscription
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
            <Repeat className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Subscriptions
          </h1>
        </div>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
          Track recurring payments and the account they are paid from.
        </p>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-2xl bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Add New Subscription
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Add recurring services like Netflix, Spotify, or utilities.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <form
          onSubmit={handleCreateSubscription}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Description
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Netflix"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="9.99"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Type
            </label>
            <select
              value={billingPeriod}
              onChange={(e) => setBillingPeriod(e.target.value as BillingPeriod)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
            >
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Account
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
            >
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0 overflow-hidden">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Date
            </label>
            <input
              type="date"
              value={nextBillingDate}
              onChange={(e) => setNextBillingDate(e.target.value)}
              className="block w-full min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 dark:disabled:bg-blue-900/40"
            >
              <Plus className="h-4 w-4" />
              {submitting ? "Adding..." : "Add subscription"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800 sm:px-8">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
              <RefreshCcw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Active Subscriptions
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Ongoing recurring payments linked to your accounts.
              </p>
            </div>
          </div>
        </div>

        {renderRows(activeSubscriptions, "No active subscriptions.", true)}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800 sm:px-8">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-slate-200 p-2.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <RefreshCcw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Cancelled Subscriptions
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Previously cancelled subscriptions kept for reference.
              </p>
            </div>
          </div>
        </div>

        {renderRows(cancelledSubscriptions, "No cancelled subscriptions.", false)}
      </section>
    </div>
  );
}