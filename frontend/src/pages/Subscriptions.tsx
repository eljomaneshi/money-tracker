import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, RefreshCcw, Repeat } from "lucide-react";
import api from "../lib/api";
import { type Currency, type ExchangeRates } from "../utils/formatMoney";
import {
  RenewalTimeline,
  type SubscriptionItem,
  type AccountItem,
} from "../components/subscriptions/RenewalTimeline";
import { SubscriptionCard } from "../components/subscriptions/SubscriptionCard";
import { Button, Card, EmptyState, Input, Select, Skeleton } from "../components/ui";

type BillingPeriod = "MONTHLY" | "YEARLY";

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

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<"ACTIVE" | "CANCELLED">("ACTIVE");

  const subscriptionNameInputRef = useRef<HTMLInputElement>(null);

  // New subscription form state
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
      setCancellingId(id);
      await api.patch(`/subscriptions/${id}/cancel`);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to cancel subscription");
    } finally {
      setCancellingId(null);
    }
  };

  const currentTabItems = activeTab === "ACTIVE" ? activeSubscriptions : cancelledSubscriptions;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-violet-500/10 p-2.5 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
            <Repeat className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Subscriptions
          </h1>
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
          Track recurring services, upcoming renewal dates, and committed cash commitments.
        </p>
      </div>

      {/* Renewal Timeline & Outflow Telemetry */}
      <RenewalTimeline
        subscriptions={subscriptions}
        accounts={accounts}
        rates={rates}
        mainCurrency={mainCurrency}
        secondCurrency={secondCurrency}
        showSecondCurrency={showSecondCurrency}
        loading={loading}
      />

      {/* Add New Subscription Section */}
      <Card padding="md">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-2xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Add New Subscription
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Track recurring services like Netflix, Spotify, or cloud hosting.
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

        <form
          onSubmit={handleCreateSubscription}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6"
        >
          <Input
            ref={subscriptionNameInputRef}
            label="Service Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Netflix, Spotify..."
            required
          />

          <Input
            label="Price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="9.99"
            required
          />

          <Select
            label="Billing Cadence"
            value={billingPeriod}
            onChange={(e) => setBillingPeriod(e.target.value as BillingPeriod)}
          >
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </Select>

          <Select
            label="Paying Account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">No linked account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.baseCurrency})
              </option>
            ))}
          </Select>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Next Renewal
            </label>
            <input
              type="date"
              value={nextBillingDate}
              onChange={(e) => setNextBillingDate(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-[#070b14] dark:text-slate-100"
            />
          </div>

          <div className="flex items-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={submitting}
              leftIcon={<Plus className="h-4 w-4" />}
              className="w-full"
            >
              Add subscription
            </Button>
          </div>
        </form>
      </Card>

      {/* Subscriptions List Section with Tabs */}
      <div className="space-y-4">
        {/* Segmented Tab Navigation */}
        <div className="flex items-center justify-between">
          <div className="inline-flex rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1 dark:border-white/10 dark:bg-[#070b14]/80">
            <button
              type="button"
              onClick={() => setActiveTab("ACTIVE")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all select-none cursor-pointer ${
                activeTab === "ACTIVE"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-[#131e35] dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <span>Active</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono tabular-nums ${
                  activeTab === "ACTIVE"
                    ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                }`}
              >
                {activeSubscriptions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("CANCELLED")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all select-none cursor-pointer ${
                activeTab === "CANCELLED"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-[#131e35] dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <span>Cancelled</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono tabular-nums ${
                  activeTab === "CANCELLED"
                    ? "bg-slate-300 text-slate-800 dark:bg-white/20 dark:text-slate-200"
                    : "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                }`}
              >
                {cancelledSubscriptions.length}
              </span>
            </button>
          </div>

          <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
            {activeTab === "ACTIVE" ? "Ongoing recurring subscriptions" : "Previously cancelled subscriptions"}
          </p>
        </div>

        {/* Content Render */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : subscriptions.length === 0 ? (
          <EmptyState
            icon={Repeat}
            title="No subscriptions tracked yet"
            description="Track your recurring monthly and yearly services to forecast renewals."
            actionText="Add a subscription"
            actionIcon={<Plus className="h-4 w-4" />}
            onAction={() => {
              subscriptionNameInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              subscriptionNameInputRef.current?.focus();
            }}
            iconBg="bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
          />
        ) : currentTabItems.length === 0 ? (
          <Card padding="md" className="py-12 text-center">
            <div className="mx-auto mb-3 inline-flex rounded-2xl bg-slate-100 p-3 text-slate-500 dark:bg-white/5 dark:text-slate-400">
              <RefreshCcw className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {activeTab === "ACTIVE" ? "No active subscriptions" : "No cancelled subscriptions"}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {activeTab === "ACTIVE"
                ? "You have no ongoing subscriptions. Add one above to begin tracking renewals."
                : "Cancelled subscriptions will appear here for historical reference."}
            </p>
          </Card>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <Card padding="none" className="overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/90 bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
                      <th className="py-3.5 pl-6 pr-4">Service</th>
                      <th className="py-3.5 pr-4 text-right">Price</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4">Paying Account</th>
                      <th className="py-3.5 px-4">Next Renewal</th>
                      <th className="py-3.5 pl-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {currentTabItems.map((sub) => (
                      <SubscriptionCard
                        key={`sub-${sub.id}`}
                        subscription={sub}
                        accounts={accounts}
                        rates={rates}
                        secondCurrency={secondCurrency}
                        showSecondCurrency={showSecondCurrency}
                        onCancel={handleCancelSubscription}
                        isCancelling={cancellingId === sub.id}
                      />
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-3.5 lg:hidden">
              {currentTabItems.map((sub) => (
                <SubscriptionCard
                  key={`sub-mobile-${sub.id}`}
                  subscription={sub}
                  accounts={accounts}
                  rates={rates}
                  secondCurrency={secondCurrency}
                  showSecondCurrency={showSecondCurrency}
                  onCancel={handleCancelSubscription}
                  isCancelling={cancellingId === sub.id}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}