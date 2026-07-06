import { Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";

type Currency = "ALL" | "EUR" | "GBP" | "USD";

const supportedCurrencies: Currency[] = ["ALL", "EUR", "GBP", "USD"];

export async function getAccounts(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    try {
        const accounts = await prisma.account.findMany({
            where: { userId: req.user.userId, deletedAt: null },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        });

        return res.json({ accounts });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to load accounts" });
    }
}

export async function getExchangeRates(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    try {
        const response = await fetch("https://open.er-api.com/v6/latest/EUR");

        if (!response.ok) {
            throw new Error("Failed to fetch exchange rates");
        }

        const data = await response.json();

        const allRate = Number(data?.rates?.ALL);
        const gbpRate = Number(data?.rates?.GBP);
        const usdRate = Number(data?.rates?.USD);

        if (
            !Number.isFinite(allRate) || allRate <= 0 ||
            !Number.isFinite(gbpRate) || gbpRate <= 0 ||
            !Number.isFinite(usdRate) || usdRate <= 0
        ) {
            throw new Error("Invalid exchange rates received");
        }

        return res.json({
            rates: {
                EUR: 1,
                ALL: allRate,
                GBP: gbpRate,
                USD: usdRate,
            },
        });
    } catch (err) {
        console.error("Exchange rates error:", err);

        return res.json({
            rates: {
                EUR: 1,
                ALL: 100,
                GBP: 0.86,
                USD: 1.08,
            },
            fallback: true,
        });
    }
}

export async function createAccount(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { name, type, balance, baseCurrency } = req.body;

    if (!name || !type || balance === undefined || balance === null) {
        return res.status(400).json({ message: "name, type and balance are required" });
    }

    const parsedBalance = Number(balance);
    if (Number.isNaN(parsedBalance)) {
        return res.status(400).json({ message: "Invalid balance" });
    }

    const parsedBaseCurrency: Currency = (baseCurrency || "EUR") as Currency;

    if (!supportedCurrencies.includes(parsedBaseCurrency)) {
        return res.status(400).json({ message: "Invalid base currency" });
    }

    try {
        const aggregate = await prisma.account.aggregate({
            where: { userId: req.user.userId, deletedAt: null },
            _max: { sortOrder: true },
        });
        const nextSortOrder = (aggregate._max.sortOrder ?? -1) + 1;

        const account = await prisma.account.create({
            data: {
                userId: req.user.userId,
                name,
                type,
                balance: parsedBalance,
                baseCurrency: parsedBaseCurrency,
                sortOrder: nextSortOrder,
            },
        });

        return res.status(201).json({ account });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to create account" });
    }
}

export async function updateAccount(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const id = Number(req.params.id);
    const { name, type, balance, baseCurrency } = req.body;

    if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Invalid account id" });
    }

    if (!name || !type || balance === undefined || balance === null) {
        return res.status(400).json({ message: "name, type and balance are required" });
    }

    const parsedBalance = Number(balance);
    if (Number.isNaN(parsedBalance)) {
        return res.status(400).json({ message: "Invalid balance" });
    }

    const parsedBaseCurrency: Currency = (baseCurrency || "EUR") as Currency;

    if (!supportedCurrencies.includes(parsedBaseCurrency)) {
        return res.status(400).json({ message: "Invalid base currency" });
    }

    try {
        const existing = await prisma.account.findFirst({
            where: { id, userId: req.user.userId, deletedAt: null },
        });

        if (!existing) {
            return res.status(404).json({ message: "Account not found" });
        }

        const account = await prisma.account.update({
            where: { id },
            data: { name, type, balance: parsedBalance, baseCurrency: parsedBaseCurrency },
        });

        return res.json({ account });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to update account" });
    }
}

export async function deleteAccount(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Invalid account id" });
    }

    try {
        const existing = await prisma.account.findFirst({
            where: { id, userId: req.user.userId, deletedAt: null },
        });

        if (!existing) {
            return res.status(404).json({ message: "Account not found" });
        }

        if (Number(existing.balance) !== 0) {
            return res.status(400).json({
                message: "Cannot delete an account with a non-zero balance. Set the balance to 0 first.",
            });
        }

        await prisma.account.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        const remaining = await prisma.account.findMany({
            where: { userId: req.user.userId, deletedAt: null },
            orderBy: { sortOrder: "asc" },
            select: { id: true },
        });

        if (remaining.length > 0) {
            await prisma.$transaction(
                remaining.map((a, index) =>
                    prisma.account.update({ where: { id: a.id }, data: { sortOrder: index } })
                )
            );
        }

        return res.json({ message: "Account deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to delete account" });
    }
}

export async function reorderAccounts(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
        return res.status(400).json({ message: "orderedIds must be a non-empty array" });
    }

    try {
        const userAccounts = await prisma.account.findMany({
            where: { userId: req.user.userId, deletedAt: null },
            select: { id: true },
        });
        const ownedIds = new Set(userAccounts.map((a) => a.id));

        const hasUnauthorized = (orderedIds as number[]).some(
            (id) => !ownedIds.has(Number(id))
        );

        if (hasUnauthorized) {
            return res.status(403).json({ message: "Forbidden" });
        }

        await prisma.$transaction(
            (orderedIds as number[]).map((id, index) =>
                prisma.account.update({
                    where: { id: Number(id) },
                    data: { sortOrder: index },
                })
            )
        );

        return res.json({ message: "Order saved" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to reorder accounts" });
    }
}