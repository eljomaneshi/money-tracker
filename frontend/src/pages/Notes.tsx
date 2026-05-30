import { useEffect, useMemo, useState } from "react";
import {
    NotebookText,
    Plus,
    Pencil,
    Save,
    Trash2,
    X,
    Clock3,
} from "lucide-react";
import api from "../lib/api";

type NoteType = "GENERAL" | "TO_RECEIVE" | "TO_PAY" | "REMINDER";
type NoteStatus = "OPEN" | "DONE" | "CANCELLED";
type RepeatPeriod = "NONE" | "MONTHLY" | "YEARLY";
type Currency = "ALL" | "EUR" | "GBP" | "USD";

type Note = {
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
};

const fieldClassName =
    "w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40";

const formatMoney = (amount: number, currency: Currency) => {
    const symbol =
        currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "";

    return currency === "ALL"
        ? `${amount.toFixed(2)} ALL`
        : `${symbol}${amount.toFixed(2)}`;
};

const formatDateForInput = (value?: string | null) => {
    if (!value) return "";
    const d = new Date(value);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

export default function Notes() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [currency, setCurrency] = useState<Currency>("EUR");
    const [personName, setPersonName] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [type, setType] = useState<NoteType>("GENERAL");
    const [status, setStatus] = useState<NoteStatus>("OPEN");
    const [repeatPeriod, setRepeatPeriod] = useState<RepeatPeriod>("NONE");

    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editAmount, setEditAmount] = useState("");
    const [editCurrency, setEditCurrency] = useState<Currency>("EUR");
    const [editPersonName, setEditPersonName] = useState("");
    const [editDueDate, setEditDueDate] = useState("");
    const [editType, setEditType] = useState<NoteType>("GENERAL");
    const [editStatus, setEditStatus] = useState<NoteStatus>("OPEN");
    const [editRepeatPeriod, setEditRepeatPeriod] = useState<RepeatPeriod>("NONE");
    const [editError, setEditError] = useState("");
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [statusFilter, setStatusFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");

            const notesRes = await api.get("/notes");
            setNotes(notesRes.data.notes || []);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || err.response?.data?.error || "Failed to load notes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredNotes = useMemo(() => {
        return notes.filter((note) => {
            const matchesStatus = !statusFilter || note.status === statusFilter;
            const matchesType = !typeFilter || note.type === typeFilter;
            return matchesStatus && matchesType;
        });
    }, [notes, statusFilter, typeFilter]);

    const resetCreateForm = () => {
        setTitle("");
        setDescription("");
        setAmount("");
        setCurrency("EUR");
        setPersonName("");
        setDueDate("");
        setType("GENERAL");
        setStatus("OPEN");
        setRepeatPeriod("NONE");
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!title.trim()) {
            setError("Title is required");
            return;
        }

        try {
            setSubmitting(true);

            await api.post("/notes", {
                title: title.trim(),
                description: description.trim() || undefined,
                amount: amount ? Number(amount) : undefined,
                currency,
                personName: personName.trim() || undefined,
                dueDate: dueDate || undefined,
                type,
                status,
                repeatPeriod,
            });

            resetCreateForm();
            await fetchData();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || err.response?.data?.error || "Failed to create note");
        } finally {
            setSubmitting(false);
        }
    };

    const openEditModal = (note: Note) => {
        setEditingNote(note);
        setEditTitle(note.title);
        setEditDescription(note.description || "");
        setEditAmount(note.amount != null ? String(note.amount) : "");
        setEditCurrency(note.currency || "EUR");
        setEditPersonName(note.personName || "");
        setEditDueDate(formatDateForInput(note.dueDate));
        setEditType(note.type);
        setEditStatus(note.status);
        setEditRepeatPeriod(note.repeatPeriod);
        setEditError("");
    };

    const closeEditModal = () => {
        setEditingNote(null);
        setEditTitle("");
        setEditDescription("");
        setEditAmount("");
        setEditCurrency("EUR");
        setEditPersonName("");
        setEditDueDate("");
        setEditType("GENERAL");
        setEditStatus("OPEN");
        setEditRepeatPeriod("NONE");
        setEditError("");
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEditError("");

        if (!editingNote) return;

        if (!editTitle.trim()) {
            setEditError("Title is required");
            return;
        }

        try {
            setEditSubmitting(true);

            await api.put(`/notes/${editingNote.id}`, {
                title: editTitle.trim(),
                description: editDescription.trim() || undefined,
                amount: editAmount ? Number(editAmount) : undefined,
                currency: editCurrency,
                personName: editPersonName.trim() || undefined,
                dueDate: editDueDate || undefined,
                type: editType,
                status: editStatus,
                repeatPeriod: editRepeatPeriod,
            });

            closeEditModal();
            await fetchData();
        } catch (err: any) {
            console.error(err);
            setEditError(err.response?.data?.message || err.response?.data?.error || "Failed to update note");
        } finally {
            setEditSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            setDeletingId(id);
            await api.delete(`/notes/${id}`);
            setNotes((prev) => prev.filter((note) => note.id !== id));

            if (editingNote?.id === id) {
                closeEditModal();
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || err.response?.data?.error || "Failed to delete note");
        } finally {
            setDeletingId(null);
        }
    };

    const getTypeBadgeClasses = (type: NoteType) => {
        switch (type) {
            case "TO_RECEIVE":
                return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";
            case "TO_PAY":
                return "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300";
            case "REMINDER":
                return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300";
            default:
                return "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
        }
    };

    const getStatusBadgeClasses = (status: NoteStatus) => {
        switch (status) {
            case "DONE":
                return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";
            case "CANCELLED":
                return "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
            default:
                return "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300";
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8">
            <div>
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-indigo-100 p-2.5 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                        <NotebookText className="h-6 w-6" />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
                        Notes
                    </h1>
                </div>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
                    Keep reminders, money to receive, money to pay, and general notes in one place.
                </p>
            </div>

            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                <div className="mb-6 flex items-start gap-3">
                    <div className="rounded-2xl bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                        <Plus className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            Add Note
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Save reminders, debts, receivables, and personal finance notes.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                        {error}
                    </div>
                )}

                <form onSubmit={handleCreate} className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                        <div className="xl:col-span-3">
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Title
                            </label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Pay internet bill"
                                className={fieldClassName}
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/30">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Main details
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Type
                                </label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as NoteType)}
                                    className={fieldClassName}
                                >
                                    <option value="GENERAL">General</option>
                                    <option value="TO_RECEIVE">To Receive</option>
                                    <option value="TO_PAY">To Pay</option>
                                    <option value="REMINDER">Reminder</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Status
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as NoteStatus)}
                                    className={fieldClassName}
                                >
                                    <option value="OPEN">Open</option>
                                    <option value="DONE">Done</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Repeat
                                </label>
                                <select
                                    value={repeatPeriod}
                                    onChange={(e) => setRepeatPeriod(e.target.value as RepeatPeriod)}
                                    className={fieldClassName}
                                >
                                    <option value="NONE">Does not repeat</option>
                                    <option value="MONTHLY">Monthly</option>
                                    <option value="YEARLY">Yearly</option>
                                </select>
                            </div>
                            <div className="min-w-0">
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                                />
                            </div>

                            <div className="md:col-span-2 xl:col-span-2">
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Extra details..."
                                    rows={4}
                                    className={fieldClassName}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/30">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Money details
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <div className="min-w-0">
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Amount
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="150.00"
                                    className={fieldClassName}
                                />
                            </div>

                            <div className="min-w-0">
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Currency
                                </label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value as Currency)}
                                    className={fieldClassName}
                                >
                                    <option value="ALL">ALL</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>

                            <div className="min-w-0">
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Person
                                </label>
                                <input
                                    value={personName}
                                    onChange={(e) => setPersonName(e.target.value)}
                                    placeholder="John / Landlord / Friend"
                                    className={fieldClassName}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-200/70 pt-4 dark:border-slate-800">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 dark:disabled:bg-blue-900/40"
                        >
                            <Plus className="h-4 w-4" />
                            {submitting ? "Adding..." : "Add note"}
                        </button>
                    </div>
                </form>
            </section>

            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                <div className="mb-6 flex items-start gap-3">
                    <div className="rounded-2xl bg-indigo-100 p-2.5 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                        <Clock3 className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            Your Notes
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Manage reminders and personal finance tasks.
                        </p>
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className={fieldClassName}
                        >
                            <option value="">All statuses</option>
                            <option value="OPEN">Open</option>
                            <option value="DONE">Done</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Type
                        </label>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className={fieldClassName}
                        >
                            <option value="">All types</option>
                            <option value="GENERAL">General</option>
                            <option value="TO_RECEIVE">To Receive</option>
                            <option value="TO_PAY">To Pay</option>
                            <option value="REMINDER">Reminder</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <p className="text-sm text-slate-400 dark:text-slate-500">Loading...</p>
                ) : filteredNotes.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        No notes found.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {filteredNotes.map((note) => (
                            <div
                                key={note.id}
                                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                            {note.title}
                                        </h3>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${getTypeBadgeClasses(
                                                    note.type
                                                )}`}
                                            >
                                                {note.type.replaceAll("_", " ")}
                                            </span>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(
                                                    note.status
                                                )}`}
                                            >
                                                {note.status}
                                            </span>
                                            {note.repeatPeriod !== "NONE" && (
                                                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                                                    {note.repeatPeriod}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(note)}
                                            className="inline-flex items-center justify-center rounded-xl bg-amber-500 p-2.5 text-white transition hover:bg-amber-600"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(note.id)}
                                            disabled={deletingId === note.id}
                                            className="inline-flex items-center justify-center rounded-xl bg-rose-600 p-2.5 text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-3 text-sm">
                                    {note.description && (
                                        <p className="text-slate-600 dark:text-slate-400">{note.description}</p>
                                    )}

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div>
                                            <p className="text-slate-500 dark:text-slate-400">Amount</p>
                                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                                                {note.amount != null
                                                    ? formatMoney(note.amount, note.currency || "EUR")
                                                    : "—"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-slate-500 dark:text-slate-400">Person</p>
                                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                                                {note.personName || "—"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-slate-500 dark:text-slate-400">Due date</p>
                                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                                                {note.dueDate ? new Date(note.dueDate).toLocaleDateString() : "—"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-slate-500 dark:text-slate-400">Updated</p>
                                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                                                {new Date(note.updatedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {editingNote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 sm:p-8">
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="rounded-2xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                                    <Pencil className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
                                        Edit Note
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        Update the note details and status.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeEditModal}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                <X className="h-4 w-4" />
                                Close
                            </button>
                        </div>

                        {editError && (
                            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                                {editError}
                            </div>
                        )}

                        <form onSubmit={handleEditSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                                <div className="xl:col-span-3">
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Title
                                    </label>
                                    <input
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className={fieldClassName}
                                    />
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/30">
                                <div className="mb-4">
                                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Main details
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Type
                                        </label>
                                        <select
                                            value={editType}
                                            onChange={(e) => setEditType(e.target.value as NoteType)}
                                            className={fieldClassName}
                                        >
                                            <option value="GENERAL">General</option>
                                            <option value="TO_RECEIVE">To Receive</option>
                                            <option value="TO_PAY">To Pay</option>
                                            <option value="REMINDER">Reminder</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Status
                                        </label>
                                        <select
                                            value={editStatus}
                                            onChange={(e) => setEditStatus(e.target.value as NoteStatus)}
                                            className={fieldClassName}
                                        >
                                            <option value="OPEN">Open</option>
                                            <option value="DONE">Done</option>
                                            <option value="CANCELLED">Cancelled</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Repeat
                                        </label>
                                        <select
                                            value={editRepeatPeriod}
                                            onChange={(e) => setEditRepeatPeriod(e.target.value as RepeatPeriod)}
                                            className={fieldClassName}
                                        >
                                            <option value="NONE">Does not repeat</option>
                                            <option value="MONTHLY">Monthly</option>
                                            <option value="YEARLY">Yearly</option>
                                        </select>
                                    </div>

                                    <div className="min-w-0">
                                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Due Date
                                        </label>
                                        <input
                                            type="date"
                                            value={editDueDate}
                                            onChange={(e) => setEditDueDate(e.target.value)}
                                            className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                                        />
                                    </div>

                                    <div className="md:col-span-2 xl:col-span-2">
                                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Description
                                        </label>
                                        <textarea
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            rows={4}
                                            className={fieldClassName}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/30">
                                <div className="mb-4">
                                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Money details
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Amount
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editAmount}
                                            onChange={(e) => setEditAmount(e.target.value)}
                                            className={fieldClassName}
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Currency
                                        </label>
                                        <select
                                            value={editCurrency}
                                            onChange={(e) => setEditCurrency(e.target.value as Currency)}
                                            className={fieldClassName}
                                        >
                                            <option value="ALL">ALL</option>
                                            <option value="EUR">EUR</option>
                                            <option value="GBP">GBP</option>
                                            <option value="USD">USD</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Person
                                        </label>
                                        <input
                                            value={editPersonName}
                                            onChange={(e) => setEditPersonName(e.target.value)}
                                            className={fieldClassName}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-end gap-3 border-t border-slate-200/70 pt-4 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    <X className="h-4 w-4" />
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editSubmitting}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 dark:disabled:bg-blue-900/40"
                                >
                                    <Save className="h-4 w-4" />
                                    {editSubmitting ? "Saving..." : "Save changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}