import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Mail,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  User,
  WalletCards,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

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

  const [currentEmail, setCurrentEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailChangeStep, setEmailChangeStep] = useState<1 | 2>(1);
  const [pendingNewEmail, setPendingNewEmail] = useState("");
  const [emailChangeCode, setEmailChangeCode] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [mainCurrency, setMainCurrency] = useState<Currency>("ALL");
  const [showSecondCurrency, setShowSecondCurrency] = useState(true);
  const [secondCurrency, setSecondCurrency] = useState<Currency>("EUR");

  const [subscriptionReminderEmails, setSubscriptionReminderEmails] =
    useState(true);
  const [subscriptionCreatedEmail, setSubscriptionCreatedEmail] =
    useState(true);
  const [subscriptionCancelledEmail, setSubscriptionCancelledEmail] =
    useState(true);

  const [accountMessage, setAccountMessage] = useState("");
  const [preferencesMessage, setPreferencesMessage] = useState("");
  const [notificationsMessage, setNotificationsMessage] = useState("");

  const [accountError, setAccountError] = useState("");
  const [preferencesError, setPreferencesError] = useState("");
  const [notificationsError, setNotificationsError] = useState("");

  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountText, setDeleteAccountText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const { logout } = useAuth();
  const navigate = useNavigate();

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
          error?.response?.data?.error || "Failed to load settings."
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

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountMessage("");
    setAccountError("");
    setSavingAccount(true);

    try {
      const { data } = await api.patch("/users/me/profile", { fullName });
      setFullName(data.user.fullName ?? "");
      setAccountMessage("Full name saved successfully.");
    } catch (error: any) {
      setAccountError(
        error?.response?.data?.error || "Failed to save full name."
      );
    } finally {
      setSavingAccount(false);
    }
  };

  const handleRequestEmailChangeCode = async (e: React.FormEvent) => {
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
      setAccountMessage("Verification code sent to your new email.");
    } catch (error: any) {
      setAccountError(
        error?.response?.data?.error || "Failed to send verification code."
      );
    } finally {
      setSavingAccount(false);
    }
  };

  const handleConfirmEmailChange = async (e: React.FormEvent) => {
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

  const handleUpdatePassword = async (e: React.FormEvent) => {
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

  const handleSavePreferences = async (e: React.FormEvent) => {
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

      setPreferencesMessage("Preferences updated successfully.");
    } catch (error: any) {
      setPreferencesError(
        error?.response?.data?.error || "Failed to update preferences."
      );
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
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

      setNotificationsMessage("Notification settings updated successfully.");
    } catch (error: any) {
      setNotificationsError(
        error?.response?.data?.error ||
          "Failed to update notification settings."
      );
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleDeleteAccount = async () => {
    setAccountMessage("");
    setAccountError("");

    if (deleteAccountText !== "DELETE") {
      setAccountError('Please type DELETE to confirm account removal.');
      return;
    }

    try {
      setDeletingAccount(true);
      await api.delete("/users/me");
      logout();
      navigate("/register");
    } catch (error: any) {
      setAccountError(
        error?.response?.data?.error || "Failed to delete account."
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 sm:p-8">
        Loading settings...
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 sm:space-y-8">
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
            Manage your account details, currency display, and email notifications.
          </p>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-2xl bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Account
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Manage your personal details and sign-in information.
              </p>
            </div>
          </div>

          {accountMessage && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
              {accountMessage}
            </div>
          )}

          {accountError && (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              {accountError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-3 flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Current email
                </label>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                {currentEmail}
              </div>
            </div>

            <form
              onSubmit={handleSaveName}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Full name
                </label>
              </div>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
              />
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                This name is used for your account profile.
              </p>
              <button
                type="submit"
                disabled={savingAccount}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:disabled:bg-blue-900/40"
              >
                <Save className="h-4 w-4" />
                {savingAccount ? "Saving..." : "Save name"}
              </button>
            </form>

            <form
              onSubmit={
                emailChangeStep === 1
                  ? handleRequestEmailChangeCode
                  : handleConfirmEmailChange
              }
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950 xl:col-span-2"
            >
              <div className="mb-3 flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Change email
                </label>
              </div>

              {emailChangeStep === 1 ? (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter your new email"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                    />
                    <button
                      type="submit"
                      disabled={savingAccount}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:disabled:bg-blue-900/40"
                    >
                      <Save className="h-4 w-4" />
                      {savingAccount ? "Sending..." : "Send verification code"}
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    We will send a verification code to your new email before changing it.
                  </p>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <input
                      type="email"
                      value={pendingNewEmail}
                      readOnly
                      className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <input
                      type="text"
                      value={emailChangeCode}
                      onChange={(e) => setEmailChangeCode(e.target.value)}
                      placeholder="Enter verification code"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={savingAccount}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:disabled:bg-blue-900/40"
                    >
                      <Save className="h-4 w-4" />
                      {savingAccount ? "Confirming..." : "Confirm email change"}
                    </button>

                    <button
                      type="button"
                      disabled={savingAccount}
                      onClick={() => {
                        setEmailChangeStep(1);
                        setPendingNewEmail("");
                        setEmailChangeCode("");
                        setAccountMessage("");
                        setAccountError("");
                      }}
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                      Change email address
                    </button>
                  </div>

                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Enter the code sent to your new email to finish the update.
                  </p>
                </>
              )}
            </form>

            <form
              onSubmit={handleUpdatePassword}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950 xl:col-span-2"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Change password
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Choose a strong password you do not use elsewhere.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Current password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    New password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingAccount}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:disabled:bg-blue-900/40"
              >
                <Save className="h-4 w-4" />
                {savingAccount ? "Saving..." : "Update password"}
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-2xl bg-teal-100 p-2.5 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
              <WalletCards className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Preferences
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Choose how balances and totals are displayed in the app.
              </p>
            </div>
          </div>

          {preferencesMessage && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
              {preferencesMessage}
            </div>
          )}

          {preferencesError && (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              {preferencesError}
            </div>
          )}

          <form onSubmit={handleSavePreferences} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Main currency for totals
                </label>
                <select
                  value={mainCurrency}
                  onChange={(e) => handleMainCurrencyChange(e.target.value as Currency)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                >
                  {ALL_CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  This currency is used for total balances shown in Dashboard and Balance.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Show second currency
                </label>
                <select
                  value={showSecondCurrency ? "yes" : "no"}
                  onChange={(e) => setShowSecondCurrency(e.target.value === "yes")}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  When enabled, a second converted currency is shown across totals,
                  accounts, expenses, and subscriptions.
                </p>
              </div>

              {showSecondCurrency && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Second currency
                  </label>
                  <select
                    value={secondCurrency}
                    onChange={(e) => setSecondCurrency(e.target.value as Currency)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                  >
                    {availableSecondCurrencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    The same second currency will be used everywhere in the app. If an
                    account or transaction already uses that currency, it will not be
                    shown twice.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={savingPreferences}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:disabled:bg-blue-900/40"
            >
              <Save className="h-4 w-4" />
              {savingPreferences ? "Saving..." : "Save preferences"}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-2xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Notifications
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Choose which subscription-related emails you want to receive.
              </p>
            </div>
          </div>

          {notificationsMessage && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
              {notificationsMessage}
            </div>
          )}

          {notificationsError && (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              {notificationsError}
            </div>
          )}

          <form onSubmit={handleSaveNotifications} className="space-y-4">
            <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950">
              <label className="flex cursor-pointer items-center justify-between gap-4 p-5">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Subscription reminder emails
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Receive an email reminder before a subscription is due.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={subscriptionReminderEmails}
                  onChange={(e) => setSubscriptionReminderEmails(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-4 p-5">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Subscription created email
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Receive an email when a new subscription is added.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={subscriptionCreatedEmail}
                  onChange={(e) => setSubscriptionCreatedEmail(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-4 p-5">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Subscription cancelled email
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Receive an email when a subscription is cancelled.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={subscriptionCancelledEmail}
                  onChange={(e) => setSubscriptionCancelledEmail(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={savingNotifications}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:disabled:bg-blue-900/40"
            >
              <Save className="h-4 w-4" />
              {savingNotifications ? "Saving..." : "Save notification settings"}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm dark:border-rose-900/40 dark:bg-slate-900 sm:p-8">
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-2xl bg-rose-100 p-2.5 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-rose-700 dark:text-rose-300">
                Danger zone
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Permanently delete your account and all accounts, expenses,
                subscriptions, and settings.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setDeleteAccountText("");
              setAccountError("");
              setShowDeleteAccountModal(true);
            }}
            className="inline-flex items-center rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Delete my account
          </button>
        </section>
      </div>

      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Permanently delete account?
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              This will permanently delete your account and all your data. This action
              cannot be undone.
            </p>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Type DELETE to confirm
              </label>
              <input
                value={deleteAccountText}
                onChange={(e) => setDeleteAccountText(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-rose-400 dark:focus:ring-rose-900/40"
                placeholder="DELETE"
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteAccountModal(false)}
                disabled={deletingAccount}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deletingAccount || deleteAccountText !== "DELETE"}
                className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingAccount ? "Deleting..." : "Delete forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}