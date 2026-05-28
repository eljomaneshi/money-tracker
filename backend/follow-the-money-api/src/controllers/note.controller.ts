import { Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";

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

    const {
        title,
        description,
        amount,
        personName,
        dueDate,
        repeatPeriod,
        type,
        status,
    } = req.body;

    if (!title) {
        return res.status(400).json({ message: "title is required" });
    }

    const parsedAmount =
        amount === null || amount === undefined || amount === ""
            ? null
            : Number(amount);

    if (parsedAmount !== null && Number.isNaN(parsedAmount)) {
        return res.status(400).json({ message: "Invalid amount" });
    }

    try {
        const note = await prisma.note.create({
            data: {
                userId: req.user.userId,
                title,
                description: description || null,
                amount: parsedAmount,
                personName: personName || null,
                dueDate: dueDate ? new Date(dueDate) : null,
                repeatPeriod: repeatPeriod || "NONE",
                type: type || "GENERAL",
                status: status || "OPEN",
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

    const {
        title,
        description,
        amount,
        personName,
        dueDate,
        repeatPeriod,
        type,
        status,
    } = req.body;

    if (!title) {
        return res.status(400).json({ message: "title is required" });
    }

    const parsedAmount =
        amount === null || amount === undefined || amount === ""
            ? null
            : Number(amount);

    if (parsedAmount !== null && Number.isNaN(parsedAmount)) {
        return res.status(400).json({ message: "Invalid amount" });
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
            data: {
                title,
                description: description || null,
                amount: parsedAmount,
                personName: personName || null,
                dueDate: dueDate ? new Date(dueDate) : null,
                repeatPeriod: repeatPeriod || "NONE",
                type: type || "GENERAL",
                status: status || "OPEN",
            },
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