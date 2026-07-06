import { Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";
import {
    Note_currency,
    Note_repeatPeriod,
    Note_type,
    Note_status,
} from "@prisma/client";

const ALLOWED_CURRENCIES: Note_currency[] = ["ALL", "EUR", "GBP", "USD"];
const ALLOWED_REPEAT_PERIODS: Note_repeatPeriod[] = ["NONE", "MONTHLY", "YEARLY"];
const ALLOWED_NOTE_TYPES: Note_type[] = ["GENERAL", "TO_RECEIVE", "TO_PAY", "REMINDER"];
const ALLOWED_NOTE_STATUSES: Note_status[] = ["OPEN", "DONE", "CANCELLED"];

type NotePayload = {
    title: string;
    description: string | null;
    amount: number | null;
    currency: Note_currency;
    personName: string | null;
    dueDate: Date | null;
    repeatPeriod: Note_repeatPeriod;
    type: Note_type;
    status: Note_status;
};

function parseAmount(amount: unknown): { value?: number | null; error?: string } {
    if (amount === null || amount === undefined || amount === "") {
        return { value: null };
    }

    const parsed = Number(amount);

    if (Number.isNaN(parsed)) {
        return { error: "Invalid amount" };
    }

    return { value: parsed };
}

function parseCurrency(value: unknown): Note_currency {
    if (typeof value !== "string") return "EUR";
    return ALLOWED_CURRENCIES.includes(value as Note_currency) ? (value as Note_currency) : "EUR";
}

function parseRepeatPeriod(value: unknown): Note_repeatPeriod {
    if (typeof value !== "string") return "NONE";
    return ALLOWED_REPEAT_PERIODS.includes(value as Note_repeatPeriod)
        ? (value as Note_repeatPeriod)
        : "NONE";
}

function parseNoteType(value: unknown): Note_type {
    if (typeof value !== "string") return "GENERAL";
    return ALLOWED_NOTE_TYPES.includes(value as Note_type)
        ? (value as Note_type)
        : "GENERAL";
}

function parseNoteStatus(value: unknown): Note_status {
    if (typeof value !== "string") return "OPEN";
    return ALLOWED_NOTE_STATUSES.includes(value as Note_status)
        ? (value as Note_status)
        : "OPEN";
}

function buildNoteData(body: any): { data?: NotePayload; error?: string } {
    const {
        title,
        description,
        amount,
        currency,
        personName,
        dueDate,
        repeatPeriod,
        type,
        status,
    } = body;

    if (!title || !String(title).trim()) {
        return { error: "title is required" };
    }

    const parsedAmount = parseAmount(amount);

    if (parsedAmount.error) {
        return { error: parsedAmount.error };
    }

    return {
        data: {
            title: String(title).trim(),
            description: description ? String(description) : null,
            amount: parsedAmount.value ?? null,
            currency: parseCurrency(currency),
            personName: personName ? String(personName) : null,
            dueDate: dueDate ? new Date(dueDate) : null,
            repeatPeriod: parseRepeatPeriod(repeatPeriod),
            type: parseNoteType(type),
            status: parseNoteStatus(status),
        },
    };
}

export async function getNotes(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    try {
        const notes = await prisma.note.findMany({
            where: { userId: req.user.userId },
            orderBy: [
                { status: "asc" },
                { dueDate: "asc" },
                { createdAt: "desc" },
            ],
        });

        return res.json({ notes });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to load notes" });
    }
}

export async function createNote(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const parsed = buildNoteData(req.body);

    if (parsed.error || !parsed.data) {
        return res.status(400).json({ message: parsed.error || "Invalid note data" });
    }

    try {
        const note = await prisma.note.create({
            data: {
                userId: req.user.userId,
                ...parsed.data,
            },
        });

        return res.status(201).json({ note });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to create note" });
    }
}

export async function updateNote(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Invalid note id" });
    }

    const parsed = buildNoteData(req.body);

    if (parsed.error || !parsed.data) {
        return res.status(400).json({ message: parsed.error || "Invalid note data" });
    }

    try {
        const existing = await prisma.note.findFirst({
            where: {
                id,
                userId: req.user.userId,
            },
        });

        if (!existing) {
            return res.status(404).json({ message: "Note not found" });
        }

        const note = await prisma.note.update({
            where: { id },
            data: parsed.data,
        });

        return res.json({ note });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to update note" });
    }
}

export async function deleteNote(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Invalid note id" });
    }

    try {
        const existing = await prisma.note.findFirst({
            where: {
                id,
                userId: req.user.userId,
            },
        });

        if (!existing) {
            return res.status(404).json({ message: "Note not found" });
        }

        await prisma.note.delete({
            where: { id },
        });

        return res.json({ message: "Note deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to delete note" });
    }
}