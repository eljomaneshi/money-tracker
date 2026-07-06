import { Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";
import type { Account } from "@prisma/client";

export async function getExpenses(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const expenses = await prisma.expense.findMany({
        where: { userId: req.user.userId },
        include: {
            account: {
                select: { id: true, name: true, baseCurrency: true },
            },
        },
        orderBy: { date: "desc" },
    });

    return res.json({ expenses });
}

export async function createExpense(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { amount, date, category, description, accountId } = req.body;

    if (amount == null || !date || !category) {
        return res
            .status(400)
            .json({ message: "amount, date, category are required" });
    }

    const numericAmount = Number(amount);

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
    }

    let linkedAccountId: number | null = null;

    if (accountId != null) {
        const id = Number(accountId);

        if (Number.isNaN(id)) {
            return res.status(400).json({ message: "Invalid accountId" });
        }

        const account = await prisma.account.findFirst({
            where: {
                id,
                userId: req.user.userId,
                deletedAt: null,
            },
        });

        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        linkedAccountId = id;
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const expense = await tx.expense.create({
                data: {
                    userId: req.user!.userId,
                    amount: numericAmount,
                    date: new Date(date),
                    category,
                    description: description || null,
                    accountId: linkedAccountId,
                },
            });

            let updatedAccount: Account | null = null;

            if (linkedAccountId) {
                updatedAccount = await tx.account.update({
                    where: { id: linkedAccountId },
                    data: {
                        balance: {
                            decrement: numericAmount,
                        },
                    },
                });
            }

            return { expense, updatedAccount };
        });

        return res.status(201).json(result);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to create expense" });
    }
}

export async function deleteExpense(req: AuthRequest, res: Response) {
    try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });

        const userId = req.user.userId;
        const id = Number(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({ message: "Invalid expense id" });
        }

        await prisma.$transaction(async (tx) => {
            const existingExpense = await tx.expense.findFirst({
                where: {
                    id,
                    userId,
                },
            });

            if (!existingExpense) {
                throw new Error("Expense not found");
            }

            if (existingExpense.accountId) {
                await tx.account.update({
                    where: { id: existingExpense.accountId },
                    data: {
                        balance: {
                            increment: Number(existingExpense.amount),
                        },
                    },
                });
            }

            await tx.expense.delete({
                where: { id },
            });
        });

        return res.json({ message: "Expense deleted successfully" });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({
            message: err.message || "Failed to delete expense",
        });
    }
}

export async function updateExpense(req: AuthRequest, res: Response) {
    try {
        const userId = req.user!.userId;
        const id = Number(req.params.id);
        const { amount, date, category, description, accountId } = req.body;

        if (!id || !amount || !date || !category) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const parsedAmount = Number(amount);

        if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ message: "Amount must be greater than 0" });
        }

        const parsedAccountId =
            accountId === null || accountId === undefined || accountId === ""
                ? null
                : Number(accountId);

        const updatedExpense = await prisma.$transaction(async (tx) => {
            const existingExpense = await tx.expense.findFirst({
                where: {
                    id,
                    userId,
                },
            });

            if (!existingExpense) {
                throw new Error("Expense not found");
            }

            const oldAmount = Number(existingExpense.amount);
            const oldAccountId = existingExpense.accountId ?? null;

            if (oldAccountId && parsedAccountId && oldAccountId === parsedAccountId) {
                const diff = oldAmount - parsedAmount;

                await tx.account.update({
                    where: { id: oldAccountId },
                    data: {
                        balance: {
                            increment: diff,
                        },
                    },
                });
            } else {
                if (oldAccountId) {
                    await tx.account.update({
                        where: { id: oldAccountId },
                        data: {
                            balance: {
                                increment: oldAmount,
                            },
                        },
                    });
                }

                if (parsedAccountId) {
                    await tx.account.update({
                        where: { id: parsedAccountId },
                        data: {
                            balance: {
                                decrement: parsedAmount,
                            },
                        },
                    });
                }
            }

            return await tx.expense.update({
                where: { id },
                data: {
                    amount: parsedAmount,
                    date: new Date(date),
                    category,
                    description: description || null,
                    accountId: parsedAccountId,
                },
            });
        });

        return res.json({
            message: "Expense updated successfully",
            expense: updatedExpense,
        });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({
            message: err.message || "Failed to update expense",
        });
    }
}