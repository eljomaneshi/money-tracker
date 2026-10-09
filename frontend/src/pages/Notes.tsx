import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  NotebookText,
  Plus,
} from "lucide-react";
import api from "../lib/api";
import { StatCard } from "../components/ui/StatCard";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";
import {
  NoteCard,
  type Note,
} from "../components/notes/NoteCard";
import {
  NoteEditorDialog,
  type NoteFormData,
} from "../components/notes/NoteEditorDialog";
import { NoteFilters } from "../components/notes/NoteFilters";

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Editor Dialog State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editorSubmitting, setEditorSubmitting] = useState(false);
  const [editorError, setEditorError] = useState("");

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/notes");
      setNotes(res.data.notes || []);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to load notes. Please check your connection."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter telemetry counts
  const counts = useMemo(() => {
    return {
      total: notes.length,
      open: notes.filter((n) => n.status === "OPEN").length,
      done: notes.filter((n) => n.status === "DONE").length,
      cancelled: notes.filter((n) => n.status === "CANCELLED").length,
      general: notes.filter((n) => n.type === "GENERAL").length,
      toReceive: notes.filter((n) => n.type === "TO_RECEIVE").length,
      toPay: notes.filter((n) => n.type === "TO_PAY").length,
      reminder: notes.filter((n) => n.type === "REMINDER").length,
    };
  }, [notes]);

  // Telemetry summaries for StatCards
  const telemetry = useMemo(() => {
    const openReminders = notes.filter(
      (n) => n.type === "REMINDER" && n.status === "OPEN"
    ).length;

    const toReceiveNotes = notes.filter(
      (n) => n.type === "TO_RECEIVE" && n.status === "OPEN"
    );
    const toPayNotes = notes.filter(
      (n) => n.type === "TO_PAY" && n.status === "OPEN"
    );

    return {
      totalNotes: notes.length,
      openReminders,
      pendingReceivablesCount: toReceiveNotes.length,
      pendingPayablesCount: toPayNotes.length,
    };
  }, [notes]);

  // Filtered notes list
  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return notes.filter((note) => {
      const matchesStatus = !statusFilter || note.status === statusFilter;
      const matchesType = !typeFilter || note.type === typeFilter;

      if (!matchesStatus || !matchesType) return false;

      if (!query) return true;

      const titleMatch = note.title.toLowerCase().includes(query);
      const descMatch = note.description
        ? note.description.toLowerCase().includes(query)
        : false;
      const personMatch = note.personName
        ? note.personName.toLowerCase().includes(query)
        : false;

      return titleMatch || descMatch || personMatch;
    });
  }, [notes, statusFilter, typeFilter, searchQuery]);

  const handleOpenCreate = () => {
    setEditingNote(null);
    setEditorError("");
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (note: Note) => {
    setEditingNote(note);
    setEditorError("");
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditingNote(null);
    setEditorError("");
  };

  const handleEditorSubmit = async (data: NoteFormData) => {
    setEditorSubmitting(true);
    setEditorError("");

    try {
      if (editingNote) {
        // Update existing note
        await api.put(`/notes/${editingNote.id}`, data);
      } else {
        // Create new note
        await api.post("/notes", data);
      }
      handleCloseEditor();
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setEditorError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to save note. Please try again."
      );
    } finally {
      setEditorSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      await api.delete(`/notes/${id}`);
      setNotes((prev) => prev.filter((note) => note.id !== id));
      if (editingNote?.id === id) {
        handleCloseEditor();
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to delete note."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setTypeFilter("");
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-100 p-2.5 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
              <NotebookText className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
              Financial Notes
            </h1>
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
            Keep track of debts, receivables, upcoming reminders, and personal notes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Note
          </Button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
        >
          {error}
        </div>
      )}

      {/* Telemetry StatCards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Notes"
          value={loading ? "—" : String(telemetry.totalNotes)}
          description="All recorded items"
          icon={NotebookText}
          iconBg="bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
          loading={loading}
        />
        <StatCard
          title="Open Reminders"
          value={loading ? "—" : String(telemetry.openReminders)}
          description="Scheduled alerts"
          icon={Bell}
          iconBg="bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
          loading={loading}
        />
        <StatCard
          title="To Receive"
          value={loading ? "—" : String(telemetry.pendingReceivablesCount)}
          description="Pending receivables"
          icon={ArrowDownLeft}
          iconBg="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
          loading={loading}
        />
        <StatCard
          title="To Pay"
          value={loading ? "—" : String(telemetry.pendingPayablesCount)}
          description="Pending obligations"
          icon={ArrowUpRight}
          iconBg="bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
          loading={loading}
        />
      </div>

      {/* Note Search & Filters */}
      <NoteFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        counts={counts}
        onReset={resetFilters}
      />

      {/* Notes Grid Section */}
      <section aria-label="Notes List">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={`skeleton-note-${i}`}
                className="rounded-3xl border border-slate-200/90 bg-white p-6 dark:border-white/10 dark:bg-[#0d1526]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48 rounded-lg" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-20 rounded-full" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-16 rounded-xl" />
                </div>
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                </div>
                <div className="mt-5 border-t border-slate-100 pt-4 dark:border-white/5">
                  <div className="grid grid-cols-4 gap-2">
                    <Skeleton className="h-8 w-full rounded-lg" />
                    <Skeleton className="h-8 w-full rounded-lg" />
                    <Skeleton className="h-8 w-full rounded-lg" />
                    <Skeleton className="h-8 w-full rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <EmptyState
            icon={NotebookText}
            title="No notes yet"
            description="Keep track of reminders, money to receive, money to pay, and financial notes organized in one place."
            actionText="Create your first note"
            onAction={handleOpenCreate}
            iconBg="bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
          />
        ) : filteredNotes.length === 0 ? (
          <EmptyState
            icon={NotebookText}
            title="No notes match your filters"
            description="We couldn't find any financial notes matching the active search query or filter tags."
            actionText="Reset filters"
            onAction={resetFilters}
            iconBg="bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                isDeleting={deletingId === note.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Note Editor Dialog (Create / Edit) */}
      <NoteEditorDialog
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        note={editingNote}
        onSubmit={handleEditorSubmit}
        isSubmitting={editorSubmitting}
        serverError={editorError}
      />
    </div>
  );
}
