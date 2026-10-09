import { useEffect, useState } from "react";
import { Check, Eye, ShieldCheck, Sparkles, X } from "lucide-react";
import api from "../../lib/api";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Dialog } from "../ui/Dialog";
import { SettingsSection } from "./SettingsSection";

export interface AiInsightsCardProps {
  userEmail: string;
  mainCurrency: string;
}

export function AiInsightsCard({ userEmail, mainCurrency }: AiInsightsCardProps) {
  const [aiOptIn, setAiOptIn] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isLoadingAiPreview, setIsLoadingAiPreview] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiSuccess, setAiSuccess] = useState("");
  const [aiPreviewData, setAiPreviewData] = useState<any | null>(null);
  const [showAiPreviewModal, setShowAiPreviewModal] = useState(false);

  useEffect(() => {
    if (userEmail) {
      const savedOptIn = localStorage.getItem(
        `moneytracker_ai_insights_opt_in_${userEmail}`
      );
      setAiOptIn(savedOptIn === "true");
    }
  }, [userEmail]);

  const handleToggleAiOptIn = (enabled: boolean) => {
    setAiError("");
    setAiSuccess("");
    const key = `moneytracker_ai_insights_opt_in_${userEmail}`;

    if (enabled) {
      setAiOptIn(true);
      if (userEmail) {
        localStorage.setItem(key, "true");
      }
      setAiSuccess(
        "AI insights enabled. You can generate spending summaries or review data anytime."
      );
    } else {
      setAiOptIn(false);
      if (userEmail) {
        localStorage.removeItem(key);
      }
      setAiSummary("");
      setAiPreviewData(null);
      setShowAiPreviewModal(false);
      setAiSuccess("AI insights disabled. All cached summaries cleared.");
    }
  };

  const handlePreviewAiData = async () => {
    setAiError("");
    setIsLoadingAiPreview(true);
    try {
      const response = await api.get("/users/me/ai-insights/preview");
      setAiPreviewData(response.data?.metrics || response.data);
      setShowAiPreviewModal(true);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setAiPreviewData({
          currency: mainCurrency || "EUR",
          monthlyTotal: 0,
          topCategories: [],
          activeSubscriptionsCount: 0,
          subscriptionMonthlyTotal: 0,
          notice: "Sample schema: only numeric aggregates are transmitted.",
        });
        setShowAiPreviewModal(true);
      } else {
        setAiError(
          err?.response?.data?.error ||
            "Failed to load data preview. Please check your connection and try again."
        );
      }
    } finally {
      setIsLoadingAiPreview(false);
    }
  };

  const handleGenerateAiInsights = async () => {
    if (!aiOptIn) {
      setAiError(
        "Please enable the AI Insights feature before generating summaries."
      );
      return;
    }
    setAiError("");
    setAiSuccess("");
    setIsGeneratingAi(true);

    try {
      const response = await api.post("/users/me/ai-insights/generate", {
        optInConfirmed: true,
      });
      setAiSummary(response.data?.summary || "No insights returned.");
      setAiSuccess("AI financial insight generated successfully.");
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setAiError("Too many analysis requests. Please try again later.");
      } else if (err?.response?.status === 501) {
        setAiError(
          err?.response?.data?.error ||
            "Claude AI service is not configured on this server."
        );
      } else {
        setAiError(
          err?.response?.data?.error ||
            "Failed to generate AI insights. Please check your connection and try again."
        );
      }
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <SettingsSection
      icon={Sparkles}
      iconBg="bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
      title="AI Insights (Optional)"
      description="Privacy-preserving, numeric-only monthly financial summaries powered by Claude."
      badge={
        <Badge variant={aiOptIn ? "success" : "neutral"} dot>
          {aiOptIn ? "Opted In" : "Disabled"}
        </Badge>
      }
      successMessage={aiSuccess}
      errorMessage={aiError}
    >
      {/* Switch Toggle Row */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 dark:border-white/5 dark:bg-[#070b14]/50">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Enable AI Spending Insights
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Explicit opt-in required before aggregate data is calculated.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={aiOptIn}
          onClick={() => handleToggleAiOptIn(!aiOptIn)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
            aiOptIn ? "bg-violet-600 dark:bg-violet-500" : "bg-slate-300 dark:bg-slate-700"
          }`}
        >
          <span className="sr-only">Toggle AI Insights</span>
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              aiOptIn ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Privacy & Data Guarantees Box */}
      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-5 dark:border-white/5 dark:bg-[#070b14]/50">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Privacy & Data Security Guarantees
          </h4>
        </div>

        <div className="mt-3.5 grid gap-3.5 text-xs sm:grid-cols-2">
          <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
            <span className="mt-0.5 font-bold text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4" />
            </span>
            <span>
              <strong className="text-slate-900 dark:text-slate-100">
                What Claude receives:
              </strong>{" "}
              High-level numeric aggregates only (total 30-day spend, category
              percentages, active subscription count).
            </span>
          </div>

          <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
            <span className="mt-0.5 font-bold text-rose-600 dark:text-rose-400">
              <X className="h-4 w-4" />
            </span>
            <span>
              <strong className="text-slate-900 dark:text-slate-100">
                What Claude NEVER sees:
              </strong>{" "}
              Your name, email address, transaction descriptions, merchants,
              account numbers, or personal notes.
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePreviewAiData}
          disabled={isLoadingAiPreview}
          isLoading={isLoadingAiPreview}
          leftIcon={<Eye className="h-4 w-4 text-slate-400" />}
        >
          Preview data payload
        </Button>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleGenerateAiInsights}
          disabled={!aiOptIn || isGeneratingAi}
          isLoading={isGeneratingAi}
          leftIcon={<Sparkles className="h-4 w-4" />}
          className="bg-violet-600 hover:bg-violet-500 text-white shadow-sm dark:bg-violet-600 dark:hover:bg-violet-500 dark:text-white"
        >
          Generate insights
        </Button>

        {aiOptIn && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleToggleAiOptIn(false)}
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
          >
            Revoke consent
          </Button>
        )}
      </div>

      {/* AI Summary Observation Display */}
      {aiSummary && (
        <div className="rounded-2xl border border-violet-200/90 bg-violet-50/60 p-5 dark:border-violet-900/40 dark:bg-violet-950/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-bold text-violet-950 dark:text-violet-200 text-sm">
              <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <span>Claude Spending Observations</span>
            </div>
            <button
              type="button"
              onClick={() => setAiSummary("")}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Dismiss
            </button>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {aiSummary}
          </p>
        </div>
      )}

      {/* Sanitized Data Preview Dialog */}
      <Dialog
        isOpen={showAiPreviewModal}
        onClose={() => setShowAiPreviewModal(false)}
        title="Sanitized Data Preview"
        description="This is the exact JSON payload evaluated for insights. Notice that descriptions, personal notes, and account identities are completely absent."
        maxWidth="lg"
      >
        <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200/90 bg-slate-900 p-4 dark:border-white/10 dark:bg-[#070b14]">
          <pre className="font-mono text-xs text-emerald-400">
            {JSON.stringify(aiPreviewData, null, 2)}
          </pre>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => setShowAiPreviewModal(false)}
          >
            Close Preview
          </Button>
        </div>
      </Dialog>
    </SettingsSection>
  );
}
