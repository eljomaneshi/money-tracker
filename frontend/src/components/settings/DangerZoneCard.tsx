import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Dialog } from "../ui/Dialog";
import { SettingsSection } from "./SettingsSection";

export function DangerZoneCard() {
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    setError("");

    if (deleteConfirmationText !== "DELETE") {
      setError('Please type DELETE to confirm account removal.');
      return;
    }

    try {
      setIsDeleting(true);
      await api.delete("/users/me");
      logout();
      navigate("/register");
    } catch (err: any) {
      setError(
        err?.response?.data?.error || "Failed to delete account. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <SettingsSection
        icon={AlertTriangle}
        iconBg="bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
        title="Danger Zone"
        description="Permanently delete your account and all associated accounts, transactions, subscriptions, and financial notes."
        danger
        errorMessage={error}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Delete Account & All Financial Records
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Once initiated, all your data will be permanently wiped. This action is
              irreversible and cannot be undone.
            </p>
          </div>

          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={() => {
              setDeleteConfirmationText("");
              setError("");
              setShowModal(true);
            }}
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            Delete my account
          </Button>
        </div>
      </SettingsSection>

      {/* Delete Confirmation Modal using v2 Dialog */}
      <Dialog
        isOpen={showModal}
        onClose={() => {
          if (!isDeleting) {
            setShowModal(false);
          }
        }}
        title="Permanently Delete Account?"
        description="This will permanently delete your user profile and all accounts, transaction logs, subscriptions, and notes. This cannot be undone."
        maxWidth="md"
      >
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
          >
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="Type DELETE to confirm"
            value={deleteConfirmationText}
            onChange={(e) => setDeleteConfirmationText(e.target.value)}
            placeholder="DELETE"
            className="font-mono"
            disabled={isDeleting}
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirmationText !== "DELETE"}
              isLoading={isDeleting}
            >
              Delete forever
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
