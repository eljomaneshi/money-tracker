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
} from "lucide-react";
import api from "../../lib/api";
import { SettingsSection } from "./SettingsSection";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

export function AppleShortcutsCard() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Quick test state
  const [testAmount, setTestAmount] = useState("350");
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
  const prodWebhookUrl = "https://moneytracker.online/integrations/quick-expense";
  const localHostIp =
    typeof window !== "undefined" && window.location.hostname !== "localhost"
      ? window.location.hostname
      : "192.168.1.104";
  const localWebhookUrl = `http://${localHostIp}:4000/integrations/quick-expense`;
  const [selectedEnv, setSelectedEnv] = useState<"prod" | "local">("prod");
  const webhookUrl = selectedEnv === "prod" ? prodWebhookUrl : localWebhookUrl;

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ apiKey: string | null }>("/integrations/api-key");
      setApiKey(res.data.apiKey);
    } catch (err: any) {
      setError("Failed to fetch API key.");
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
    } else if (type === "url") {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
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
      const res = await api.post("/integrations/quick-expense", {
        amount: Number(testAmount),
        merchant: testMerchant,
        cardName: testCard || undefined,
      }, {
        headers: {
          "X-API-Key": apiKey,
        },
      });

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
          No iOS App Required
        </span>
      }
      successMessage={message}
      errorMessage={error}
    >
      {/* Overview info banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-100/90 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 p-5 dark:border-indigo-900/30 dark:from-indigo-950/30 dark:via-[#090f1e] dark:to-purple-950/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              How it works
            </h4>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Using the native <strong>Shortcuts (Shkurtoret)</strong> app pre-installed on iOS, you can trigger an automatic webhook whenever Apple Pay completes a purchase. The Money Tracker backend categorizes the merchant automatically (e.g. <em>Spar &rarr; Food</em>, <em>Shell &rarr; Transport</em>), links it to your matching card/account, and logs the expense instantly!
            </p>
          </div>
        </div>
      </div>

      {/* API Key Management Box */}
      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-5 dark:border-white/5 dark:bg-[#070b14]/50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-slate-200/70 p-2 text-slate-700 dark:bg-white/10 dark:text-slate-300">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Personal Webhook Key
              </p>
              <div className="mt-1 flex items-center gap-2">
                {isLoading ? (
                  <span className="text-xs text-slate-400">Loading key...</span>
                ) : apiKey ? (
                  <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
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
                Production (Cloud / Cellular)
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

      {/* Step-by-Step Setup Guide */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#070b14]/40">
        <div className="flex items-center justify-between pb-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Smartphone className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            iPhone Setup Guide (Takes 2 Minutes)
          </h3>
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs font-medium text-teal-600 hover:underline dark:text-teal-400"
          >
            {showGuide ? "Collapse guide" : "Expand guide"}
          </button>
        </div>

        {showGuide && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Step 1 */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-white/5 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                    1
                  </span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Create Automation
                  </h4>
                </div>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  Open the <strong>Shortcuts</strong> app on your iPhone. Tap the <strong>Automation</strong> tab at the bottom, then tap <strong>+ (New Automation)</strong>.
                </p>
              </div>

              {/* Step 2 */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-white/5 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                    2
                  </span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Choose Transaction
                  </h4>
                </div>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  Select <strong>Transaction</strong>. Set Card to <strong>Any Card</strong> (or pick specific card), and choose <strong>Run Immediately</strong> (turn off "Notify When Run").
                </p>
              </div>

              {/* Step 3 */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-white/5 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                    3
                  </span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Get Contents of URL
                  </h4>
                </div>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  Add action <strong>Get Contents of URL</strong> with method <strong>POST</strong>, Header <code className="text-[11px] font-mono">X-API-Key</code>, and JSON fields below.
                </p>
              </div>
            </div>

            {/* Detailed Action Parameters */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-4 dark:border-white/5 dark:bg-[#0c1424]">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Action "Get Contents of URL" Configuration
              </p>
              <div className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                  <span className="w-32 font-semibold text-slate-900 dark:text-slate-100">URL:</span>
                  <code className="font-mono text-teal-600 dark:text-teal-400">{webhookUrl}</code>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                  <span className="w-32 font-semibold text-slate-900 dark:text-slate-100">Method:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">POST</span>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                  <span className="w-32 font-semibold text-slate-900 dark:text-slate-100">Headers:</span>
                  <span className="font-mono">
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
      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-5 dark:border-white/5 dark:bg-[#070b14]/50">
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Test Quick Expense Webhook Right Now
          </h3>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Simulate an Apple Pay transaction from your browser to verify that classification and ledger deduction work instantly.
        </p>

        <form onSubmit={handleRunTest} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Amount"
              type="number"
              step="any"
              value={testAmount}
              onChange={(e) => setTestAmount(e.target.value)}
              placeholder="150"
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
              label="Card / Account Name (Optional)"
              type="text"
              value={testCard}
              onChange={(e) => setTestCard(e.target.value)}
              placeholder="e.g. Wallet, BKT, or leave blank"
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
                className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium ${
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
