import { useState } from "react";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import api from "../../lib/api";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { SettingsSection } from "./SettingsSection";

export function ExportDataCard() {
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [exportError, setExportError] = useState("");
  const [exportSuccess, setExportSuccess] = useState("");

  const handleExportData = async (format: "json" | "csv") => {
    setExportError("");
    setExportSuccess("");

    if (format === "json") {
      setIsExportingJson(true);
    } else {
      setIsExportingCsv(true);
    }

    try {
      const response = await api.get(`/users/me/export?format=${format}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type:
          format === "json"
            ? "application/json"
            : "text/csv;charset=utf-8;",
      });

      const dateStr = new Date().toISOString().split("T")[0];
      const filename =
        format === "json"
          ? `money-tracker-export-${dateStr}.json`
          : `money-tracker-ledger-${dateStr}.csv`;

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setExportSuccess(
        format === "json"
          ? "Full JSON backup archive downloaded successfully."
          : "CSV activity ledger downloaded successfully."
      );
    } catch (err: any) {
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          setExportError(
            parsed.error || "Failed to export data. Please try again."
          );
        } catch {
          setExportError("Failed to export data. Please try again.");
        }
      } else if (err?.response?.status === 429) {
        setExportError(
          "Too many export requests. Please try again in 15 minutes."
        );
      } else {
        setExportError(
          err?.response?.data?.error ||
            "Failed to export data. Please check your connection and try again."
        );
      }
    } finally {
      if (format === "json") {
        setIsExportingJson(false);
      } else {
        setIsExportingCsv(false);
      }
    }
  };

  return (
    <SettingsSection
      icon={Download}
      iconBg="bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
      title="Data Portability & Export"
      description="Download a full offline copy of your personal financial records for backup or spreadsheet analysis."
      successMessage={exportSuccess}
      errorMessage={exportError}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {/* JSON Export Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-slate-50/70 p-5 dark:border-white/5 dark:bg-[#070b14]/50">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileJson className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  JSON Data Archive
                </h3>
              </div>
              <Badge variant="purple">Full Backup</Badge>
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Complete structured backup containing your profile preferences,
              accounts, all expenses, subscriptions, notes, and activity history.
            </p>
          </div>

          <div className="mt-5">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => handleExportData("json")}
              disabled={isExportingJson || isExportingCsv}
              isLoading={isExportingJson}
              leftIcon={<Download className="h-4 w-4" />}
              className="w-full"
            >
              Download JSON backup
            </Button>
          </div>
        </div>

        {/* CSV Export Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-slate-50/70 p-5 dark:border-white/5 dark:bg-[#070b14]/50">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  CSV Activity Ledger
                </h3>
              </div>
              <Badge variant="success">Spreadsheet</Badge>
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Spreadsheet-compatible ledger of all financial activity, expenses,
              deposits, withdrawals, and subscriptions for Excel or Google
              Sheets.
            </p>
          </div>

          <div className="mt-5">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => handleExportData("csv")}
              disabled={isExportingJson || isExportingCsv}
              isLoading={isExportingCsv}
              leftIcon={<Download className="h-4 w-4" />}
              className="w-full"
            >
              Download CSV ledger
            </Button>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
