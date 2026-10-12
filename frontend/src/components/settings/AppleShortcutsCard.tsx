import { useEffect, useState } from "react";
import {
  Smartphone,
  Key,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  Zap,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Plus,
  Shield,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api from "../../lib/api";
import { SettingsSection } from "./SettingsSection";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface Account {
  id: number;
  name: string;
  balance: number;
  baseCurrency: string;
}

interface CardMapping {
  cardName: string;
  accountId: number;
}

interface ApplePaySettingsData {
  unmappedAction: "ignore" | "default";
  defaultAccountId: number | null;
  cardMappings: CardMapping[];
}

export function AppleShortcutsCard() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Multi-card settings state
  const [unmappedAction, setUnmappedAction] = useState<"ignore" | "default">("ignore");
  const [defaultAccountId, setDefaultAccountId] = useState<number | null>(null);
  const [cardMappings, setCardMappings] = useState<CardMapping[]>([]);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState("");

  // New mapping input row
  const [newCardName, setNewCardName] = useState("");
  const [newAccountId, setNewAccountId] = useState<number | "">("");

  // Quick test simulator state
  const [testAmount, setTestAmount] = useState("250");
  const [testMerchant, setTestMerchant] = useState("Spar Supermarket");
  const [testCard, setTestCard] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{
    success: boolean;
    text: string;
  } | null>(null);

  // Active instructions tab
  const [showGuide, setShowGuide] = useState(true);

  // Webhook URLs
  const prodBase =
    import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes("localhost")
      ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
      : "https://moneytracker.online";
  const prodWebhookUrl = `${prodBase}/integrations/quick-expense`;
  const localHostIp =
    typeof window !== "undefined" && window.location.hostname !== "localhost"
      ? window.location.hostname
      : "192.168.1.104";
  const localWebhookUrl = `http://${localHostIp}:5173/integrations/quick-expense`;
  const [selectedEnv, setSelectedEnv] = useState<"prod" | "local">("prod");
  const webhookUrl = selectedEnv === "prod" ? prodWebhookUrl : localWebhookUrl;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [keyRes, accountsRes, settingsRes] = await Promise.all([
        api.get<{ apiKey: string | null }>("/integrations/api-key"),
        api.get<Account[]>("/accounts"),
        api.get<{ apiKey: string | null; settings: ApplePaySettingsData }>("/integrations/settings"),
      ]);

      setApiKey(keyRes.data.apiKey);
      setAccounts(accountsRes.data || []);

      if (settingsRes.data?.settings) {
        setUnmappedAction(settingsRes.data.settings.unmappedAction || "ignore");
        setDefaultAccountId(settingsRes.data.settings.defaultAccountId || null);
        setCardMappings(settingsRes.data.settings.cardMappings || []);
        if (!settingsRes.data.settings.defaultAccountId && accountsRes.data.length > 0) {
          setDefaultAccountId(accountsRes.data[0].id);
        }
      } else if (accountsRes.data.length > 0) {
        setDefaultAccountId(accountsRes.data[0].id);
      }
    } catch (err: any) {
      setError("Failed to load integration and card settings.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    try {
      setIsGenerating(true);
      setError("");
      setMessage("");
      const res = await api.post<{ apiKey: string; message: string }>("/integrations/api-key/generate");
      setApiKey(res.data.apiKey);
      setShowKey(true);
      setMessage("New API key generated successfully. Keep it private!");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to generate API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeKey = async () => {
    if (
      !window.confirm(
        "Are you sure you want to revoke this API key? Any active Apple Pay or Shortcuts automations using this key will immediately stop working."
      )
    ) {
      return;
    }

    try {
      setIsRevoking(true);
      setError("");
      setMessage("");
      await api.delete("/integrations/api-key");
      setApiKey(null);
      setShowKey(false);
      setMessage("API key has been revoked.");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to revoke API key.");
    } finally {
      setIsRevoking(false);
    }
  };

  const handleCopy = (text: string, type: "key" | "url") => {
    navigator.clipboard.writeText(text);
    if (type === "key") {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleAddCardMapping = () => {
    if (!newCardName.trim()) {
      setError("Please enter the card name as it appears in Apple Wallet (e.g., 'BKT Visa Gold').");
      return;
    }
    const targetAccountId = typeof newAccountId === "number" ? newAccountId : accounts[0]?.id;
    if (!targetAccountId) {
      setError("Please select a target account.");
      return;
    }

    // Check if card name is already in mappings
    if (cardMappings.some((m) => m.cardName.toLowerCase() === newCardName.trim().toLowerCase())) {
      setError(`Card mapping for "${newCardName.trim()}" already exists.`);
      return;
    }

    setError("");
    setCardMappings([...cardMappings, { cardName: newCardName.trim(), accountId: targetAccountId }]);
    setNewCardName("");
    setNewAccountId("");
  };

  const handleRemoveCardMapping = (indexToRemove: number) => {
    setCardMappings(cardMappings.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveCardSettings = async () => {
    try {
      setIsSavingSettings(true);
      setError("");
      setSettingsSuccess("");
      await api.put("/integrations/settings", {
        unmappedAction,
        defaultAccountId: defaultAccountId || (accounts[0]?.id ?? null),
        cardMappings,
      });
      setSettingsSuccess("Card mappings and unmapped card policies saved successfully!");
      setTimeout(() => setSettingsSuccess(""), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to save card settings.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRunTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      setError("Please generate an API key first before testing.");
      return;
    }

    try {
      setIsTesting(true);
      setTestFeedback(null);
      const res = await api.post(
        "/integrations/quick-expense",
        {
          amount: Number(testAmount),
          merchant: testMerchant,
          cardName: testCard.trim() || undefined,
        },
        {
          headers: {
            "X-API-Key": apiKey,
          },
        }
      );

      setTestFeedback({
        success: true,
        text: res.data.message || "Test expense recorded successfully!",
      });
    } catch (err: any) {
      setTestFeedback({
        success: false,
        text: err?.response?.data?.error || "Test webhook failed.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <SettingsSection
      icon={Smartphone}
      iconBg="bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
      title="Apple Pay & iOS Shortcuts Automation"
      description="Automatically record expenses in real-time whenever you pay with your iPhone or Apple Watch."
      badge={
        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/80 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300">
          <Zap className="h-3 w-3" />
          No App Required
        </span>
      }
      successMessage={message}
      errorMessage={error}
    >
      {/* Overview info banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-100/90 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 p-4 sm:p-5 dark:border-indigo-900/30 dark:from-indigo-950/30 dark:via-[#090f1e] dark:to-purple-950/20">
        <div className="flex flex-col gap-2.5">
          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Sparkles className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
            Automatic Zero-Touch Expense Logging
          </h4>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Using the built-in <strong>Shortcuts (Shkurtoret)</strong> app on iOS, every Apple Pay transaction can automatically trigger an encrypted webhook to your Money Tracker ledger. The system auto-categorizes merchants (e.g. <em>Spar &rarr; Food</em>, <em>Shell &rarr; Transport</em>), links to your mapped account, and rejects invalid overdrafts.
          </p>
        </div>
      </div>

      {/* API Key Management Box */}
      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 sm:p-5 dark:border-white/5 dark:bg-[#070b14]/50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-slate-200/70 p-2 text-slate-700 shrink-0 dark:bg-white/10 dark:text-slate-300">
              <Key className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Personal Webhook Key
              </p>
              <div className="mt-1 flex items-center gap-2">
                {isLoading ? (
                  <span className="text-xs text-slate-400">Loading key...</span>
                ) : apiKey ? (
                  <span className="break-all font-mono text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {showKey ? apiKey : `mt_live_••••••••••••••••••••••••••••••••`}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    No active integration key. Click generate below to begin.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {apiKey && (
              <>
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showKey ? "Hide" : "Reveal"}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(apiKey, "key")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  {copiedKey ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copiedKey ? "Copied!" : "Copy Key"}
                </button>
                <button
                  type="button"
                  onClick={handleRevokeKey}
                  disabled={isRevoking}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Revoke
                </button>
              </>
            )}

            <Button
              type="button"
              variant={apiKey ? "outline" : "primary"}
              size="sm"
              isLoading={isGenerating}
              onClick={handleGenerateKey}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              {apiKey ? "Regenerate Key" : "Generate API Key"}
            </Button>
          </div>
        </div>

        {/* Webhook Endpoint Box */}
        <div className="mt-4 border-t border-slate-200/80 pt-4 dark:border-white/5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Webhook Target URL
            </p>
            {/* Environment Toggle */}
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 dark:border-white/10 dark:bg-white/5">
              <button
                type="button"
                onClick={() => setSelectedEnv("prod")}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  selectedEnv === "prod"
                    ? "bg-white text-indigo-700 shadow-sm dark:bg-white/15 dark:text-indigo-300"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Production (Cloud / 4G/5G)
              </button>
              <button
                type="button"
                onClick={() => setSelectedEnv("local")}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  selectedEnv === "local"
                    ? "bg-white text-indigo-700 shadow-sm dark:bg-white/15 dark:text-indigo-300"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Local Network (Wi-Fi Test)
              </button>
            </div>
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <code className="break-all rounded-xl border border-slate-200/90 bg-white px-3 py-2 font-mono text-xs text-slate-800 dark:border-white/10 dark:bg-[#0c1424] dark:text-slate-200">
              {webhookUrl}
            </code>
            <button
              type="button"
              onClick={() => handleCopy(webhookUrl, "url")}
              className="inline-flex items-center justify-center gap-1.5 shrink-0 rounded-xl bg-slate-200/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-300/80 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
            >
              {copiedUrl ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copiedUrl ? "Copied URL!" : "Copy URL"}
            </button>
          </div>
          {selectedEnv === "local" && (
            <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400">
              Note: Local URL only works when your iPhone is connected to the same Wi-Fi network as this PC ({localHostIp}).
            </p>
          )}
        </div>
      </div>

      {/* Multi-Card & Account Linking Configuration */}
      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 sm:p-5 dark:border-white/5 dark:bg-[#070b14]/50">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-200/80 dark:border-white/5">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Apple Pay Cards & Account Linking
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            For users with multiple cards in Apple Wallet
          </span>
        </div>

        {/* Unmapped Card Policy */}
        <div className="mt-4 space-y-3">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            What should happen if you pay with an unlinked card?
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                unmappedAction === "ignore"
                  ? "border-indigo-500 bg-indigo-50/50 dark:border-indigo-500/80 dark:bg-indigo-950/20"
                  : "border-slate-200/80 bg-white dark:border-white/10 dark:bg-[#090f1e]"
              }`}
            >
              <input
                type="radio"
                name="unmappedAction"
                checked={unmappedAction === "ignore"}
                onChange={() => setUnmappedAction("ignore")}
                className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-500" />
                  Ignore transaction (Recommended)
                </span>
                <p className="mt-1 text-slate-500 dark:text-slate-400 leading-normal">
                  If you pay with a business, personal, or secondary card not linked below, the transaction will be skipped safely without affecting your balances.
                </p>
              </div>
            </label>

            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                unmappedAction === "default"
                  ? "border-indigo-500 bg-indigo-50/50 dark:border-indigo-500/80 dark:bg-indigo-950/20"
                  : "border-slate-200/80 bg-white dark:border-white/10 dark:bg-[#090f1e]"
              }`}
            >
              <input
                type="radio"
                name="unmappedAction"
                checked={unmappedAction === "default"}
                onChange={() => setUnmappedAction("default")}
                className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  Log under Default Account
                </span>
                <p className="mt-1 text-slate-500 dark:text-slate-400 leading-normal">
                  Always log transactions from unmapped cards under a designated default account:
                </p>
                {unmappedAction === "default" && accounts.length > 0 && (
                  <div className="mt-2">
                    <select
                      value={defaultAccountId || accounts[0]?.id || ""}
                      onChange={(e) => setDefaultAccountId(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-white/10 dark:bg-[#070b14] dark:text-slate-100"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.baseCurrency})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Configured Card Mappings Table / List */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Specific Card Mappings ({cardMappings.length})
            </p>
            <span className="text-[11px] text-slate-400">
              Matches card name sent from Apple Wallet
            </span>
          </div>

          {cardMappings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center dark:border-white/10">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No custom card mappings configured yet. By default, card names matching your accounts (e.g., "BKT", "Revolut") will auto-link. Add explicit mappings below if names differ.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {cardMappings.map((mapping, idx) => {
                const targetAcc = accounts.find((a) => a.id === mapping.accountId);
                return (
                  <div
                    key={idx}
                    className="flex flex-col gap-2 rounded-xl border border-slate-200/90 bg-white p-3 dark:border-white/10 dark:bg-[#090f1e] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        "{mapping.cardName}"
                      </span>
                      <span className="text-slate-400 text-xs">&rarr;</span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800 dark:bg-white/10 dark:text-slate-200">
                        {targetAcc ? `${targetAcc.name} (${targetAcc.baseCurrency})` : `Account #${mapping.accountId}`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveCardMapping(idx)}
                      className="self-end sm:self-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add New Mapping Row */}
          <div className="mt-3 rounded-xl border border-slate-200/90 bg-white p-3 dark:border-white/10 dark:bg-[#090f1e]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              + Link a New Apple Wallet Card
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12 sm:items-center">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  placeholder="Card Name in Apple Wallet (e.g. BKT Visa Gold)"
                  value={newCardName}
                  onChange={(e) => setNewCardName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-[#070b14] dark:text-slate-100"
                />
              </div>

              <div className="sm:col-span-5">
                <select
                  value={newAccountId || (accounts[0]?.id ?? "")}
                  onChange={(e) => setNewAccountId(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-[#070b14] dark:text-slate-100"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.baseCurrency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleAddCardMapping}
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Save Settings Button */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isSavingSettings}
              onClick={handleSaveCardSettings}
              leftIcon={<Save className="h-3.5 w-3.5" />}
            >
              Save Card Linking Rules
            </Button>

            {settingsSuccess && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                {settingsSuccess}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Step-by-Step Setup Guide */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm dark:border-white/5 dark:bg-[#070b14]/40">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Smartphone className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            iPhone Setup Guide (2 Minutes)
          </h3>
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:underline dark:text-teal-400"
          >
            {showGuide ? "Hide" : "Show"}
            {showGuide ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {showGuide && (
          <div className="space-y-4 pt-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {/* Step 1 */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-white/5 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-[11px] font-bold text-white">
                    1
                  </span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Create Automation
                  </h4>
                </div>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Open the <strong>Shortcuts</strong> app on your iPhone. Tap <strong>Automation</strong> at the bottom, then tap <strong>+ (New Automation)</strong>.
                </p>
              </div>

              {/* Step 2 */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-white/5 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-[11px] font-bold text-white">
                    2
                  </span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Card & Run Mode
                  </h4>
                </div>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Select <strong>Transaction</strong>. Set Card to <strong>Any Card</strong> (or select specific cards). Choose <strong>Run Immediately</strong> and turn off <em>Notify When Run</em>.
                </p>
              </div>

              {/* Step 3 */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-white/5 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-[11px] font-bold text-white">
                    3
                  </span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Webhook Action
                  </h4>
                </div>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Add action <strong>Get Contents of URL</strong> with method <strong>POST</strong>, Header <code className="text-[11px] font-mono">X-API-Key</code>, and JSON fields below.
                </p>
              </div>
            </div>

            {/* Detailed Action Parameters */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-3.5 dark:border-white/5 dark:bg-[#0c1424]">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Action "Get Contents of URL" Configuration
              </p>
              <div className="mt-2.5 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="w-28 font-semibold text-slate-900 dark:text-slate-100">URL:</span>
                  <code className="break-all font-mono text-teal-600 dark:text-teal-400">{webhookUrl}</code>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="w-28 font-semibold text-slate-900 dark:text-slate-100">Method:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">POST</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="w-28 font-semibold text-slate-900 dark:text-slate-100">Headers:</span>
                  <span className="break-all font-mono">
                    Key: <strong className="text-indigo-600 dark:text-indigo-400">X-API-Key</strong> &rarr; Value:{" "}
                    <strong className="text-indigo-600 dark:text-indigo-400">
                      {apiKey || "(Your Generated API Key)"}
                    </strong>
                  </span>
                </div>
                <div className="flex flex-col gap-1 pt-1">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Request Body (JSON):</span>
                  <div className="relative mt-1">
                    <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-3 font-mono text-[11px] text-slate-800 dark:border-white/10 dark:bg-[#070b14] dark:text-slate-200">
{`{
  "amount": Shortcut Input (Amount),
  "merchant": Shortcut Input (Merchant),
  "cardName": Shortcut Input (Card),
  "date": Shortcut Input (Date)
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Webhook Simulator / Quick Test */}
      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 sm:p-5 dark:border-white/5 dark:bg-[#070b14]/50">
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Test Quick Expense Webhook Right Now
          </h3>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Simulate an Apple Pay transaction right from this screen to test card matching, unmapped policy, and balance deduction.
        </p>

        <form onSubmit={handleRunTest} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              label="Amount"
              type="number"
              step="any"
              value={testAmount}
              onChange={(e) => setTestAmount(e.target.value)}
              placeholder="250"
              required
            />
            <Input
              label="Merchant / Business"
              type="text"
              value={testMerchant}
              onChange={(e) => setTestMerchant(e.target.value)}
              placeholder="e.g. Spar, Shell, Zara..."
              required
            />
            <Input
              label="Card Name in Apple Wallet (Optional)"
              type="text"
              value={testCard}
              onChange={(e) => setTestCard(e.target.value)}
              placeholder="e.g. BKT Visa Gold, Revolut..."
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isTesting}
              leftIcon={<Send className="h-4 w-4" />}
            >
              Send Test Quick Expense
            </Button>

            {testFeedback && (
              <div
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${
                  testFeedback.success
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                }`}
              >
                {testFeedback.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                )}
                <span>{testFeedback.text}</span>
              </div>
            )}
          </div>
        </form>
      </div>
    </SettingsSection>
  );
}
