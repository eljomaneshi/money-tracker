import { Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";
import { Currency, NoteStatus, NoteType, RepeatPeriod } from "@prisma/client";

const ALLOWED_CURRENCIES: Currency[] = ["ALL", "EUR", "GBP", "USD"];
const ALLOWED_REPEAT_PERIODS: RepeatPeriod[] = ["NONE", "MONTHLY", "YEARLY"];
const ALLOWED_NOTE_TYPES: NoteType[] = ["GENERAL", "TO_RECEIVE", "TO_PAY", "REMINDER"];
const ALLOWED_NOTE_STATUSES: NoteStatus[] = ["OPEN", "DONE", "CANCELLED"];

type NotePayload = {
    title: string;
    description: string | null;
    amount: number | null;
    currency: Currency;
    personName: string | null;
    dueDate: Date | null;
    repeatPeriod: RepeatPeriod;
    type: NoteType;
    status: NoteStatus;
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

function parseCurrency(value: unknown): Currency {
    if (typeof value !== "string") return "EUR";
    return ALLOWED_CURRENCIES.includes(value as Currency) ? (value as Currency) : "EUR";
}

function parseRepeatPeriod(value: unknown): RepeatPeriod {
    if (typeof value !== "string") return "NONE";
    return ALLOWED_REPEAT_PERIODS.includes(value as RepeatPeriod)
        ? (value as RepeatPeriod)
        : "NONE";
}

function parseNoteType(value: unknown): NoteType {
    if (typeof value !== "string") return "GENERAL";
    return ALLOWED_NOTE_TYPES.includes(value as NoteType)
        ? (value as NoteType)
        : "GENERAL";
}

function parseNoteStatus(value: unknown): NoteStatus {
    if (typeof value !== "string") return "OPEN";
    return ALLOWED_NOTE_STATUSES.includes(value as NoteStatus)
        ? (value as NoteStatus)
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