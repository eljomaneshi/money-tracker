import { useEffect, useState, type FormEvent } from "react";
import { Dialog } from "../ui/Dialog";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import type { Currency, Note, NoteStatus, NoteType, RepeatPeriod } from "./NoteCard";

export interface NoteFormData {
  title: string;
  description?: string;
  amount?: number;
  currency: Currency;
  personName?: string;
  dueDate?: string;
  type: NoteType;
  status: NoteStatus;
  repeatPeriod: RepeatPeriod;
}

export interface NoteEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  note?: Note | null;
  onSubmit: (data: NoteFormData) => Promise<void>;
  isSubmitting?: boolean;
  serverError?: string;
}

const formatDateForInput = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function NoteEditorDialog({
  isOpen,
  onClose,
  note,
  onSubmit,
  isSubmitting = false,
  serverError,
}: NoteEditorDialogProps) {
  const isEditing = Boolean(note);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [personName, setPersonName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [type, setType] = useState<NoteType>("GENERAL");
  const [status, setStatus] = useState<NoteStatus>("OPEN");
  const [repeatPeriod, setRepeatPeriod] = useState<RepeatPeriod>("NONE");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setDescription(note.description || "");
      setAmount(note.amount != null ? String(note.amount) : "");
      setCurrency(note.currency || "EUR");
      setPersonName(note.personName || "");
      setDueDate(formatDateForInput(note.dueDate));
      setType(note.type);
      setStatus(note.status);
      setRepeatPeriod(note.repeatPeriod);
    } else {
      setTitle("");
      setDescription("");
      setAmount("");
      setCurrency("EUR");
      setPersonName("");
      setDueDate("");
      setType("GENERAL");
      setStatus("OPEN");
      setRepeatPeriod("NONE");
    }
    setValidationError("");
  }, [note, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!title.trim()) {
      setValidationError("Note title is required");
      return;
    }

    const parsedAmount = amount.trim() ? parseFloat(amount) : undefined;
    if (parsedAmount !== undefined && (isNaN(parsedAmount) || parsedAmount < 0)) {
      setValidationError("Amount must be a valid positive number");
      return;
    }

    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      amount: parsedAmount,
      currency,
      personName: personName.trim() || undefined,
      dueDate: dueDate || undefined,
      type,
      status,
      repeatPeriod,
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Financial Note" : "Create Financial Note"}
      description={
        isEditing
          ? "Update details, amounts, or status for this note."
          : "Track receivables, payables, reminders, or general financial notes."
      }
      maxWidth="xl"
    >
      {(validationError || serverError) && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
        >
          {validationError || serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <Input
          label="Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Pay rent, Collect invoice #104, Review taxes"
        />

        {/* Classification Group */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/5 dark:bg-[#070b14]/50">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Classification & Timing
          </h4>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <Select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value as NoteType)}
              options={[
                { value: "GENERAL", label: "General Note" },
                { value: "TO_RECEIVE", label: "To Receive (Receivable)" },
                { value: "TO_PAY", label: "To Pay (Payable)" },
                { value: "REMINDER", label: "Reminder" },
              ]}
            />

            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as NoteStatus)}
              options={[
                { value: "OPEN", label: "Open" },
                { value: "DONE", label: "Done" },
                { value: "CANCELLED", label: "Cancelled" },
              ]}
            />

            <Select
              label="Recurrence"
              value={repeatPeriod}
              onChange={(e) => setRepeatPeriod(e.target.value as RepeatPeriod)}
              options={[
                { value: "NONE", label: "Does not repeat" },
                { value: "MONTHLY", label: "Monthly" },
                { value: "YEARLY", label: "Yearly" },
              ]}
            />
          </div>

          <div className="mt-3.5">
            <Input
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        {/* Financial Details Group */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/5 dark:bg-[#070b14]/50">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Money & Counterparty Details
          </h4>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <Input
                label="Amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="sm:col-span-1">
              <Select
                label="Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                options={[
                  { value: "ALL", label: "ALL" },
                  { value: "EUR", label: "EUR" },
                  { value: "GBP", label: "GBP" },
                  { value: "USD", label: "USD" },
                ]}
              />
            </div>

            <div className="sm:col-span-1">
              <Input
                label="Person / Entity"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="e.g., Landlord, Client, Alex"
              />
            </div>
          </div>
        </div>

        {/* Description textarea */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Description / Details
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Add any specific context, account numbers, or reference notes..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-150 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-[#070b14] dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
          />
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
          >
            {isEditing ? "Save Changes" : "Create Note"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
