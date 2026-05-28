import { Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";

export async function getAccountActions(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    try {
        const actions = await prisma.accountAction.findMany({
            where: { userId: req.user.userId },
            include: {
                account: {
                    select: { id: true, name: true, baseCurrency: true },
                },
                toAccount: {
                    select: { id: true, name: true, baseCurrency: true },
                },
            },
            orderBy: { date: "desc" },
        });

        return res.json({ actions });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to load account actions" });
    }
}

export async function depositToAccount(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { accountId, amount, description, date } = req.body;

    const parsedAccountId = Number(accountId);
    const parsedAmount = Number(amount);

    if (Number.isNaN(parsedAccountId)) {
        return res.status(400).json({ message: "Invalid accountId" });
    }

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    if (!date) {
        return res.status(400).json({ message: "date is required" });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const account = await tx.account.findFirst({
                where: {
                    id: parsedAccountId,
                    userId: req.user!.userId,
                },
            });

            if (!account) {
                throw new Error("Account not found");
            }

            const updatedAccount = await tx.account.update({
                where: { id: account.id },
                data: {
                    balance: {
                        increment: parsedAmount,
                    },
                },
            });

            const action = await tx.accountAction.create({
                data: {
                    userId: req.user!.userId,
                    accountId: account.id,
                    type: "DEPOSIT",
                    amount: parsedAmount,
                    description: description || null,
                    date: new Date(date),
                },
            });

            return { action, updatedAccount };
        });

        return res.status(201).json(result);
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({
            message: err.message || "Failed to deposit money",
        });
    }
}

export async function withdrawFromAccount(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { accountId, amount, description, date } = req.body;

    const parsedAccountId = Number(accountId);
    const parsedAmount = Number(amount);

    if (Number.isNaN(parsedAccountId)) {
        return res.status(400).json({ message: "Invalid accountId" });
    }

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    if (!date) {
        return res.status(400).json({ message: "date is required" });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const account = await tx.account.findFirst({
                where: {
                    id: parsedAccountId,
                    userId: req.user!.userId,
                },
            });

            if (!account) {
                throw new Error("Account not found");
            }

            const updatedAccount = await tx.account.update({
                where: { id: account.id },
                data: {
                    balance: {
                        decrement: parsedAmount,
                    },
                },
            });

            const action = await tx.accountAction.create({
                data: {
                    userId: req.user!.userId,
                    accountId: account.id,
                    type: "WITHDRAWAL",
                    amount: parsedAmount,
                    description: description || null,
                    date: new Date(date),
                },
            });

            return { action, updatedAccount };
        });

        return res.status(201).json(result);
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({
            message: err.message || "Failed to withdraw money",
        });
    }
}

export async function transferBetweenAccounts(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { fromAccountId, toAccountId, amount, targetAmount, description, date } = req.body;

    const parsedFromAccountId = Number(fromAccountId);
    const parsedToAccountId = Number(toAccountId);
    const parsedAmount = Number(amount);
    const parsedTargetAmount = Number(targetAmount);

    if (Number.isNaN(parsedFromAccountId) || Number.isNaN(parsedToAccountId)) {
        return res.status(400).json({ message: "Invalid account ids" });
    }

    if (parsedFromAccountId === parsedToAccountId) {
        return res.status(400).json({ message: "Source and target accounts must be different" });
    }

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ message: "Sent amount must be greater than 0" });
    }

    if (Number.isNaN(parsedTargetAmount) || parsedTargetAmount <= 0) {
        return res.status(400).json({ message: "Received amount must be greater than 0" });
    }

    if (!date) {
        return res.status(400).json({ message: "date is required" });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const fromAccount = await tx.account.findFirst({
                where: {
                    id: parsedFromAccountId,
                    userId: req.user!.userId,
                },
            });

            const toAccount = await tx.account.findFirst({
                where: {
                    id: parsedToAccountId,
                    userId: req.user!.userId,
                },
            });

            if (!fromAccount || !toAccount) {
                throw new Error("Account not found");
            }

            if (fromAccount.balance < parsedAmount) {
                throw new Error("Insufficient balance in source account");
            }

            const sameCurrency = fromAccount.baseCurrency === toAccount.baseCurrency;
            const safeTargetAmount = sameCurrency ? parsedAmount : parsedTargetAmount;
            const exchangeRate =
                sameCurrency ? 1 : parsedTargetAmount / parsedAmount;

            const updatedFromAccount = await tx.account.update({
                where: { id: fromAccount.id },
                data: {
                    balance: {
                        decrement: parsedAmount,
                    },
                },
            });

            const updatedToAccount = await tx.account.update({
                where: { id: toAccount.id },
                data: {
                    balance: {
                        increment: safeTargetAmount,
                    },
                },
            });

            const transferOut = await tx.accountAction.create({
                data: {
                    userId: req.user!.userId,
                    accountId: fromAccount.id,
                    toAccountId: toAccount.id,
                    type: "TRANSFER_OUT",
                    amount: parsedAmount,
                    targetAmount: safeTargetAmount,
                    exchangeRate,
                    description: description || null,
                    date: new Date(date),
                },
            });

            const transferIn = await tx.accountAction.create({
                data: {
                    userId: req.user!.userId,
                    accountId: toAccount.id,
                    toAccountId: fromAccount.id,
                    type: "TRANSFER_IN",
                    amount: safeTargetAmount,
                    targetAmount: parsedAmount,
                    exchangeRate,
                    description: description || null,
                    date: new Date(date),
                },
            });

            return {
                transferOut,
                transferIn,
                updatedFromAccount,
                updatedToAccount,
            };
        });

        return res.status(201).json(result);
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({
            message: err.message || "Failed to transfer money",
        });
    }
}