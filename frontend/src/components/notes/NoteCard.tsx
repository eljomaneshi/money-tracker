import { Calendar, Clock, Pencil, Trash2, User } from "lucide-react";
import { Badge, type BadgeVariant } from "../ui/Badge";
import { Button } from "../ui/Button";

export type NoteType = "GENERAL" | "TO_RECEIVE" | "TO_PAY" | "REMINDER";
export type NoteStatus = "OPEN" | "DONE" | "CANCELLED";
export type RepeatPeriod = "NONE" | "MONTHLY" | "YEARLY";
export type Currency = "ALL" | "EUR" | "GBP" | "USD";

export interface Note {
  id: number;
  title: string;
  description?: string | null;
  amount?: number | null;
  currency?: Currency | null;
  personName?: string | null;
  dueDate?: string | null;
  repeatPeriod: RepeatPeriod;
  type: NoteType;
  status: NoteStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: number) => void;
  isDeleting?: boolean;
}

const formatMoney = (amount: number, currency: Currency) => {
  const symbol =
    currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "";
  return currency === "ALL"
    ? `${amount.toFixed(2)} ALL`
    : `${symbol}${amount.toFixed(2)}`;
};

const getTypeBadgeConfig = (type: NoteType): { variant: BadgeVariant; label: string } => {
  switch (type) {
    case "TO_RECEIVE":
      return { variant: "success", label: "To Receive" };
    case "TO_PAY":
      return { variant: "danger", label: "To Pay" };
    case "REMINDER":
      return { variant: "warning", label: "Reminder" };
    default:
      return { variant: "neutral", label: "General" };
  }
};

const getStatusBadgeConfig = (status: NoteStatus): { variant: BadgeVariant; label: string } => {
  switch (status) {
    case "DONE":
      return { variant: "success", label: "Done" };
    case "CANCELLED":
      return { variant: "neutral", label: "Cancelled" };
    default:
      return { variant: "info", label: "Open" };
  }
};

export function NoteCard({
  note,
  onEdit,
  onDelete,
  isDeleting = false,
}: NoteCardProps) {
  const typeBadge = getTypeBadgeConfig(note.type);
  const statusBadge = getStatusBadgeConfig(note.status);

  return (
    <div className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:bg-[#0d1526] dark:hover:border-white/20 dark:hover:bg-[#111a30] sm:p-7">
      <div>
        {/* Top Header: Title & Quick Actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors dark:text-slate-100 dark:group-hover:text-emerald-400 sm:text-lg">
              {note.title}
            </h3>

            {/* Badges row */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <Badge variant={typeBadge.variant} dot>
                {typeBadge.label}
              </Badge>
              <Badge variant={statusBadge.variant}>
                {statusBadge.label}
              </Badge>
              {note.repeatPeriod !== "NONE" && (
                <Badge variant="purple">
                  <Clock className="mr-1 h-3 w-3" />
                  {note.repeatPeriod.toLowerCase()}
                </Badge>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit(note)}
              className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              aria-label={`Edit ${note.title}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              isLoading={isDeleting}
              onClick={() => onDelete(note.id)}
              className="text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400"
              aria-label={`Delete ${note.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Description body */}
        {note.description && (
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {note.description}
          </p>
        )}
      </div>

      {/* Meta Footer */}
      <div className="mt-5 border-t border-slate-100 pt-4 dark:border-white/5">
        <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          {/* Amount */}
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Amount
            </span>
            <div className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
              {note.amount != null ? (
                formatMoney(note.amount, note.currency || "EUR")
              ) : (
                <span className="text-slate-400 dark:text-slate-600">—</span>
              )}
            </div>
          </div>

          {/* Person */}
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Person
            </span>
            <div className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
              {note.personName ? (
                <span className="inline-flex items-center gap-1">
                  <User className="h-3 w-3 text-slate-400" />
                  {note.personName}
                </span>
              ) : (
                <span className="text-slate-400 dark:text-slate-600">—</span>
              )}
            </div>
          </div>

          {/* Due date */}
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Due Date
            </span>
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {note.dueDate ? (
                <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  {new Date(note.dueDate).toLocaleDateString()}
                </span>
              ) : (
                <span className="text-slate-400 dark:text-slate-600">—</span>
              )}
            </div>
          </div>

          {/* Updated date */}
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Updated
            </span>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              {new Date(note.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
