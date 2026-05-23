import { useEffect, useState } from "react";
import {
  BellRing,
  Plus,
  Repeat,
  RotateCcw,
  XCircle,
} from "lucide-react";
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

function SubscriptionSection({
  title,
  description,
  subscriptions,
  loading,
  getAccountName,
  formatSubscriptionPrice,
  formatConvertedPrice,
  onCancel,
  emptyText,
  icon: Icon,
}: {
  title: string;
  description: string;
  subscriptions: Subscription[];
  loading: boolean;
  getAccountName: (accountId?: number | null) => string;
  formatSubscriptionPrice: (sub: Subscription) => string;
  formatConvertedPrice: (sub: Subscription) => string | null;
  onCancel?: (id: number) => void;
  emptyText: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="rounded-2xl bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Loading...</p>
      ) : subscriptions.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">{emptyText}</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full text-left">
              <thead className="border-b border-slate-200 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="py-3 pr-4 font-medium">Name</th>
                  <th className="py-3 pr-4 font-medium">Price</th>
                  <th className="py-3 pr-4 font-medium">Billing</th>
                  <th className="py-3 pr-4 font-medium">Next billing date</th>
                  <th className="py-3 pr-4 font-medium">Paid from</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => {
                  const converted = formatConvertedPrice(sub);

                  return (
                    <tr
                      key={sub.id}
                      className="border-b border-slate-100 last:border-b-0 dark:border-slate-800"
                    >
                      <td className="py-4 pr-4 text-slate-900 dark:text-slate-100">
                        {sub.name}
                      </td>
                      <td className="py-4 pr-4">
                        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          {formatSubscriptionPrice(sub)}
                        </p>
                        {converted && (
                          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                            {converted}
                          </p>
                        )}
                      </td>
                      <td className="py-4 pr-4 text-slate-700 dark:text-slate-300">
                        {sub.billingPeriod === "MONTHLY" ? "Monthly" : "Yearly"}
                      </td>
                      <td className="py-4 pr-4 text-slate-700 dark:text-slate-300">
                        {new Date(sub.nextBillingDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 pr-4 text-slate-700 dark:text-slate-300">
                        {getAccountName(sub.accountId)}
                      </td>
                      <td className="py-4 pr-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            sub.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {sub.status === "ACTIVE" ? "Active" : "Cancelled"}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {onCancel && sub.status === "ACTIVE" ? (
                          <button
                            type="button"
                            onClick={() => onCancel(sub.id)}
                            className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                            Cancel
                          </button>
                        ) : (
                          <span className="text-sm text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {subscriptions.map((sub) => {
              const converted = formatConvertedPrice(sub);

              return (
                <div
                  key={sub.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {sub.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {sub.billingPeriod === "MONTHLY" ? "Monthly" : "Yearly"}
                      </p>
                    </div>

                    <div className="text-right sm:text-left">
                      <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {formatSubscriptionPrice(sub)}
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
                      <p className="text-slate-500 dark:text-slate-400">Paid from</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {getAccountName(sub.accountId)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Next billing date</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {new Date(sub.nextBillingDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Status</p>
                      <p
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          sub.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {sub.status === "ACTIVE" ? "Active" : "Cancelled"}
                      </p>
                    </div>
                  </div>

                  {onCancel && sub.status === "ACTIVE" && (
                    <button
                      type="button"
                      onClick={() => onCancel(sub.id)}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel subscription
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [settings, setSettings] = useState<SettingsResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("MONTHLY");
  const [nextBillingDate, setNextBillingDate] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [subscriptionsRes, accountsRes, ratesRes, settingsRes] = await Promise.all([
        api.get("/subscriptions"),
        api.get("/accounts"),
        api.get("/accounts/exchange-rates"),
        api.get<SettingsResponse>("/users/me/settings"),
      ]);

      setSubscriptions(subscriptionsRes.data.subscriptions || []);
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

  const getAccountCurrency = (accountId?: number | null): Currency => {
    const account = getAccountById(accountId);
    return account?.baseCurrency || "EUR";
  };

  const formatSubscriptionPrice = (sub: Subscription) => {
    const currency = getAccountCurrency(sub.accountId);
    return formatMoney(sub.price, currency, moneyPosition(currency));
  };

  const formatConvertedPrice = (sub: Subscription) => {
    if (!rates || !showSecondCurrency) return null;

    const sourceCurrency = getAccountCurrency(sub.accountId);
    if (sourceCurrency === secondCurrency) return null;

    const converted = convertAmount(sub.price, sourceCurrency, secondCurrency, rates);
    return formatMoney(converted, secondCurrency, moneyPosition(secondCurrency));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !price || !billingPeriod || !nextBillingDate) {
      setError("Please fill all fields");
      return;
    }

    if (!selectedAccountId) {
      setError("Please select the account/resource");
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/subscriptions", {
        name,
        price: Number(price),
        billingPeriod,
        nextBillingDate,
        accountId: selectedAccountId,
      });

      setName("");
      setPrice("");
      setBillingPeriod("MONTHLY");
      setNextBillingDate("");
      setSelectedAccountId("");

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
      setError("");
      await api.patch(`/subscriptions/${id}/cancel`);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to cancel subscription");
    }
  };

  const activeSubs = subscriptions.filter((sub) => sub.status === "ACTIVE");
  const cancelledSubs = subscriptions.filter((sub) => sub.status === "CANCELLED");

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
            <BellRing className="h-6 w-6" />
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
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                <Plus className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Add Subscription
              </h2>
            </div>
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
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Name
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
              Price
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
              Billing period
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
              Next billing date
            </label>
            <input
              type="date"
              value={nextBillingDate}
              onChange={(e) => setNextBillingDate(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
            />
          </div>

          <div>
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

          <div className="xl:col-span-5">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 dark:disabled:bg-blue-900/40"
            >
              <Plus className="h-4 w-4" />
              {submitting ? "Adding..." : "Add subscription"}
            </button>
          </div>
        </form>
      </section>

      <SubscriptionSection
        title="Active Subscriptions"
        description="Ongoing recurring payments linked to your accounts."
        subscriptions={activeSubs}
        loading={loading}
        getAccountName={getAccountName}
        formatSubscriptionPrice={formatSubscriptionPrice}
        formatConvertedPrice={formatConvertedPrice}
        onCancel={handleCancelSubscription}
        emptyText="No active subscriptions yet."
        icon={Repeat}
      />

      <SubscriptionSection
        title="Cancelled Subscriptions"
        description="Previously cancelled subscriptions kept for reference."
        subscriptions={cancelledSubs}
        loading={loading}
        getAccountName={getAccountName}
        formatSubscriptionPrice={formatSubscriptionPrice}
        formatConvertedPrice={formatConvertedPrice}
        emptyText="No canceled subscriptions yet."
        icon={RotateCcw}
      />
    </div>
  );
}