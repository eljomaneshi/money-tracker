import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Bell,
  Mail,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  User,
  WalletCards,
} from "lucide-react";
import api from "../lib/api";
import { SettingsSection } from "../components/settings/SettingsSection";
import { ExportDataCard } from "../components/settings/ExportDataCard";
import { AiInsightsCard } from "../components/settings/AiInsightsCard";
import { DangerZoneCard } from "../components/settings/DangerZoneCard";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";

type Currency = "ALL" | "EUR" | "GBP" | "USD";

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

const ALL_CURRENCIES: Currency[] = ["ALL", "EUR", "GBP", "USD"];

export default function Settings() {
  const [isLoading, setIsLoading] = useState(true);

  // Account state
  const [currentEmail, setCurrentEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailChangeStep, setEmailChangeStep] = useState<1 | 2>(1);
  const [pendingNewEmail, setPendingNewEmail] = useState("");
  const [emailChangeCode, setEmailChangeCode] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Currency preferences state
  const [mainCurrency, setMainCurrency] = useState<Currency>("ALL");
  const [showSecondCurrency, setShowSecondCurrency] = useState(true);
  const [secondCurrency, setSecondCurrency] = useState<Currency>("EUR");

  // Notification preferences state
  const [subscriptionReminderEmails, setSubscriptionReminderEmails] =
    useState(true);
  const [subscriptionCreatedEmail, setSubscriptionCreatedEmail] =
    useState(true);
  const [subscriptionCancelledEmail, setSubscriptionCancelledEmail] =
    useState(true);

  // Notification banners
  const [accountMessage, setAccountMessage] = useState("");
  const [accountError, setAccountError] = useState("");
  const [preferencesMessage, setPreferencesMessage] = useState("");
  const [preferencesError, setPreferencesError] = useState("");
  const [notificationsMessage, setNotificationsMessage] = useState("");
  const [notificationsError, setNotificationsError] = useState("");

  // Loading states
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await api.get<SettingsResponse>("/users/me/settings");

        setCurrentEmail(data.email);
        setFullName(data.fullName ?? "");
        setMainCurrency(data.totalsMainCurrency);
        setShowSecondCurrency(data.showSecondCurrency);
        setSecondCurrency(data.secondCurrency ?? "EUR");
        setSubscriptionReminderEmails(data.notifySubscriptionReminder);
        setSubscriptionCreatedEmail(data.notifySubscriptionCreated);
        setSubscriptionCancelledEmail(data.notifySubscriptionCancelled);
      } catch (error: any) {
        setAccountError(
          error?.response?.data?.error || "Failed to load account settings."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const availableSecondCurrencies = useMemo(() => {
    return ALL_CURRENCIES.filter((currency) => currency !== mainCurrency);
  }, [mainCurrency]);

  const handleMainCurrencyChange = (value: Currency) => {
    setMainCurrency(value);

    if (value === secondCurrency) {
      const fallback = ALL_CURRENCIES.find((currency) => currency !== value);
      if (fallback) {
        setSecondCurrency(fallback);
      }
    }
  };

  const handleSaveName = async (e: FormEvent) => {
    e.preventDefault();
    setAccountMessage("");
    setAccountError("");
    setSavingAccount(true);

    try {
      const { data } = await api.patch("/users/me/profile", { fullName });
      setFullName(data.user.fullName ?? "");
      setAccountMessage("Full name updated successfully.");
    } catch (error: any) {
      setAccountError(
        error?.response?.data?.error || "Failed to save full name."
      );
    } finally {
      setSavingAccount(false);
    }
  };

  const handleRequestEmailChangeCode = async (e: FormEvent) => {
    e.preventDefault();
    setAccountMessage("");
    setAccountError("");
    setSavingAccount(true);

    try {
      const normalizedEmail = newEmail.trim().toLowerCase();

      await api.post("/users/me/request-email-change-code", {
        newEmail: normalizedEmail,
      });

      setPendingNewEmail(normalizedEmail);
      setEmailChangeCode("");
      setEmailChangeStep(2);
      setAccountMessage("Verification code sent to your new email address.");
    } catch (error: any) {
      setAccountError(
        error?.response?.data?.error || "Failed to send verification code."
      );
    } finally {
      setSavingAccount(false);
    }
  };

  const handleConfirmEmailChange = async (e: FormEvent) => {
    e.preventDefault();
    setAccountMessage("");
    setAccountError("");
    setSavingAccount(true);

    try {
      const { data } = await api.post("/users/me/confirm-email-change", {
        newEmail: pendingNewEmail,
        code: emailChangeCode,
      });

      setCurrentEmail(data.user.email);
      setNewEmail("");
      setPendingNewEmail("");
      setEmailChangeCode("");
      setEmailChangeStep(1);
      setAccountMessage("Email updated successfully.");
    } catch (error: any) {
      setAccountError(
        error?.response?.data?.error || "Failed to confirm email change."
      );
    } finally {
      setSavingAccount(false);
    }
  };

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    setAccountMessage("");
    setAccountError("");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setAccountError("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setAccountError("New passwords do not match.");
      return;
    }

    setSavingAccount(true);

    try {
      await api.patch("/users/me/password", {
        currentPassword,
        newPassword,
      });

      setAccountMessage("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error: any) {
      setAccountError(
        error?.response?.data?.error || "Failed to update password."
      );
    } finally {
      setSavingAccount(false);
    }
  };

  const handleSavePreferences = async (e: FormEvent) => {
    e.preventDefault();
    setPreferencesMessage("");
    setPreferencesError("");
    setSavingPreferences(true);

    try {
      await api.patch("/users/me/preferences", {
        totalsMainCurrency: mainCurrency,
        showSecondCurrency,
        secondCurrency: showSecondCurrency ? secondCurrency : null,
      });

      setPreferencesMessage("Display preferences saved successfully.");
    } catch (error: any) {
      setPreferencesError(
        error?.response?.data?.error || "Failed to update preferences."
      );
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleSaveNotifications = async (e: FormEvent) => {
    e.preventDefault();
    setNotificationsMessage("");
    setNotificationsError("");
    setSavingNotifications(true);

    try {
      await api.patch("/users/me/notifications", {
        notifySubscriptionReminder: subscriptionReminderEmails,
        notifySubscriptionCreated: subscriptionCreatedEmail,
        notifySubscriptionCancelled: subscriptionCancelledEmail,
      });

      setNotificationsMessage("Notification settings saved successfully.");
    } catch (error: any) {
      setNotificationsError(
        error?.response?.data?.error || "Failed to update notification settings."
      );
    } finally {
      setSavingNotifications(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div>
          <Skeleton className="h-10 w-48 rounded-2xl" />
          <Skeleton className="mt-2 h-5 w-80 rounded-lg" />
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={`settings-skeleton-${i}`}
            className="rounded-3xl border border-slate-200/90 bg-white p-6 dark:border-white/10 dark:bg-[#0d1526] sm:p-8"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-2xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-6 w-40 rounded-lg" />
                <Skeleton className="h-4 w-64 rounded-md" />
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <Skeleton className="h-12 w-full rounded-2xl" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-200 p-2.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <SettingsIcon className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Settings
          </h1>
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
          Manage your personal account details, currency preferences, and notification controls.
        </p>
      </div>

      {/* 1. Account Details & Password */}
      <SettingsSection
        icon={User}
        iconBg="bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"
        title="Account & Security"
        description="Manage your profile information, registered email address, and account password."
        successMessage={accountMessage}
        errorMessage={accountError}
      >
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Current Email Display */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-5 dark:border-white/5 dark:bg-[#070b14]/50">
            <div className="mb-2 flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-400" />
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Current Registered Email
              </label>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-900 dark:border-white/10 dark:bg-[#0d1526] dark:text-slate-100">
              {currentEmail}
            </div>
          </div>

          {/* Full Name Form */}
          <form
            onSubmit={handleSaveName}
            className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-5 dark:border-white/5 dark:bg-[#070b14]/50"
          >
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              helperText="This name appears in your personal dashboard greeting."
            />
            <div className="mt-4">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={savingAccount}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Save name
              </Button>
            </div>
          </form>

          {/* Change Email Two-Step Form */}
          <form
            onSubmit={
              emailChangeStep === 1
                ? handleRequestEmailChangeCode
                : handleConfirmEmailChange
            }
            className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-5 dark:border-white/5 dark:bg-[#070b14]/50 xl:col-span-2"
          >
            <div className="mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-400" />
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Change Email Address
              </label>
            </div>

            {emailChangeStep === 1 ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <Input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter new email address"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={savingAccount}
                    leftIcon={<Save className="h-4 w-4" />}
                  >
                    Send verification code
                  </Button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  We will send a one-time verification code to the new address before completing the update.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Pending New Email"
                    value={pendingNewEmail}
                    readOnly
                    className="font-mono bg-slate-100 dark:bg-slate-900"
                  />
                  <Input
                    label="Verification Code"
                    value={emailChangeCode}
                    onChange={(e) => setEmailChangeCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="font-mono"
                    required
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={savingAccount}
                    leftIcon={<Save className="h-4 w-4" />}
                  >
                    Confirm email change
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      setEmailChangeStep(1);
                      setPendingNewEmail("");
                      setEmailChangeCode("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </form>

          {/* Change Password Form */}
          <form
            onSubmit={handleUpdatePassword}
            className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-5 dark:border-white/5 dark:bg-[#070b14]/50 xl:col-span-2"
          >
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Update Password
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="mt-4">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={savingAccount}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Update password
              </Button>
            </div>
          </form>
        </div>
      </SettingsSection>

      {/* 2. Display Preferences */}
      <SettingsSection
        icon={WalletCards}
        iconBg="bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300"
        title="Display & Currency Preferences"
        description="Choose default currency formats and configure dual-currency balance views."
        successMessage={preferencesMessage}
        errorMessage={preferencesError}
      >
        <form onSubmit={handleSavePreferences} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Primary totals currency"
              value={mainCurrency}
              onChange={(e) => handleMainCurrencyChange(e.target.value as Currency)}
              options={ALL_CURRENCIES.map((c) => ({ value: c, label: c }))}
              helperText="This currency is used for consolidated totals across your Dashboard and Balance views."
            />

            <Select
              label="Show secondary converted currency"
              value={showSecondCurrency ? "yes" : "no"}
              onChange={(e) => setShowSecondCurrency(e.target.value === "yes")}
              options={[
                { value: "yes", label: "Yes (Show secondary conversion)" },
                { value: "no", label: "No (Primary only)" },
              ]}
              helperText="Displays real-time secondary conversions alongside balances and expenses."
            />

            {showSecondCurrency && (
              <div className="sm:col-span-2">
                <Select
                  label="Secondary display currency"
                  value={secondCurrency}
                  onChange={(e) => setSecondCurrency(e.target.value as Currency)}
                  options={availableSecondCurrencies.map((c) => ({
                    value: c,
                    label: c,
                  }))}
                  helperText="The secondary currency applied across accounts and transactions."
                />
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={savingPreferences}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save preferences
          </Button>
        </form>
      </SettingsSection>

      {/* 3. Subscription Email Notifications */}
      <SettingsSection
        icon={Bell}
        iconBg="bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
        title="Email Notifications"
        description="Configure automated transactional alerts and renewal reminder emails."
        successMessage={notificationsMessage}
        errorMessage={notificationsError}
      >
        <form onSubmit={handleSaveNotifications} className="space-y-4">
          <div className="space-y-3">
            {/* Reminder emails */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 dark:border-white/5 dark:bg-[#070b14]/50">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Subscription renewal reminders
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Receive an email reminder 3 days prior to an upcoming subscription renewal.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={subscriptionReminderEmails}
                onClick={() =>
                  setSubscriptionReminderEmails(!subscriptionReminderEmails)
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  subscriptionReminderEmails
                    ? "bg-emerald-600 dark:bg-emerald-500"
                    : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span className="sr-only">Toggle reminder emails</span>
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    subscriptionReminderEmails
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Created subscription emails */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 dark:border-white/5 dark:bg-[#070b14]/50">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  New subscription creation confirmation
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Receive a confirmation email when a recurring subscription is registered.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={subscriptionCreatedEmail}
                onClick={() =>
                  setSubscriptionCreatedEmail(!subscriptionCreatedEmail)
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  subscriptionCreatedEmail
                    ? "bg-emerald-600 dark:bg-emerald-500"
                    : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span className="sr-only">Toggle creation confirmation emails</span>
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    subscriptionCreatedEmail ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Cancelled subscription emails */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 dark:border-white/5 dark:bg-[#070b14]/50">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Subscription cancellation confirmation
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Receive an email notification when an existing subscription is cancelled.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={subscriptionCancelledEmail}
                onClick={() =>
                  setSubscriptionCancelledEmail(!subscriptionCancelledEmail)
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  subscriptionCancelledEmail
                    ? "bg-emerald-600 dark:bg-emerald-500"
                    : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span className="sr-only">Toggle cancellation emails</span>
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    subscriptionCancelledEmail
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={savingNotifications}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Save notification settings
            </Button>
          </div>
        </form>
      </SettingsSection>

      {/* 4. Feedback & Direct Founder Support */}
      <SettingsSection
        icon={Mail}
        iconBg="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
        title="Feedback & Founder Support"
        description="Questions, bug reports, or feature requests? Contact the creator directly."
      >
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-5 dark:border-white/5 dark:bg-[#070b14]/50 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Founder Direct Channel
            </p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
              founder@moneytracker.online
            </p>
          </div>

          <a
            href="mailto:founder@moneytracker.online?subject=Money%20Tracker%20Feedback"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            <Mail className="h-4 w-4" />
            <span>Send email</span>
          </a>
        </div>
      </SettingsSection>

      {/* 5. Data Portability & Export */}
      <ExportDataCard />

      {/* 6. Claude AI Financial Insights */}
      <AiInsightsCard userEmail={currentEmail} mainCurrency={mainCurrency} />

      {/* 7. Danger Zone Account Deletion */}
      <DangerZoneCard />
    </div>
  );
}