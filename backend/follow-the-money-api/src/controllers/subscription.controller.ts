import { Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";
import { processDueSubscriptionsForUser } from "../services/subscriptionBilling";
import { sendSubscriptionRemindersForUser } from "../services/subscriptionReminder";
import {
    sendSubscriptionCancelledEmail,
    sendSubscriptionCreatedEmail,
} from "../services/emailService";
import { formatMoney, Currency } from "../utils/formatMoney";

export async function getSubscriptions(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const subs = await prisma.subscription.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: "desc" },
    });

    return res.json({ subscriptions: subs });
}

export async function createSubscription(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { name, price, billingPeriod, nextBillingDate, accountId } = req.body;

    if (!name || price == null || !billingPeriod || !nextBillingDate) {
        return res
            .status(400)
            .json({ message: "name, price, billingPeriod, nextBillingDate required" });
    }

    let linkedAccountId: number | null = null;
    let linkedAccountName = "No linked account";
    let accountCurrency: Currency = "EUR";

    if (accountId != null) {
        const id = Number(accountId);
        if (Number.isNaN(id)) {
            return res.status(400).json({ message: "Invalid accountId" });
        }

        const account = await prisma.account.findFirst({
            where: { id, userId: req.user.userId },
            select: {
                id: true,
                name: true,
                baseCurrency: true,
            },
        });

        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        linkedAccountId = id;
        linkedAccountName = account.name;
        accountCurrency = account.baseCurrency as Currency;
    }

    const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
            email: true,
            notifySubscriptionCreated: true,
        },
    });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const sub = await prisma.subscription.create({
        data: {
            name,
            price: Number(price),
            billingPeriod,
            nextBillingDate: new Date(nextBillingDate),
            status: "ACTIVE",
            userId: req.user.userId,
            accountId: linkedAccountId,
        },
    });

    const formattedAmount = formatMoney(
        Number(sub.price),
        accountCurrency,
        accountCurrency === "ALL" ? "after" : "before"
    );

    if (user.notifySubscriptionCreated) {
        try {
            await sendSubscriptionCreatedEmail({
                to: user.email,
                subscriptionName: sub.name,
                billingPeriod: sub.billingPeriod,
                nextBillingDate: sub.nextBillingDate,
                linkedAccountName,
                formattedAmount,
            });
        } catch (err) {
            console.error("Failed to send creation email:", err);
        }
    }

    return res.status(201).json({ subscription: sub });
}

export async function cancelSubscription(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Invalid subscription id" });
    }

    const existing = await prisma.subscription.findFirst({
        where: { id, userId: req.user.userId },
        include: {
            user: {
                select: {
                    email: true,
                    notifySubscriptionCancelled: true,
                },
            },
            account: {
                select: {
                    name: true,
                    baseCurrency: true,
                },
            },
        },
    });

    if (!existing) {
        return res.status(404).json({ message: "Subscription not found" });
    }

    if (existing.status === "CANCELLED") {
        return res.status(400).json({ message: "Subscription already cancelled" });
    }

    const updated = await prisma.subscription.update({
        where: { id },
        data: { status: "CANCELLED" },
    });

    const linkedAccountName = existing.account?.name || null;
    const accountCurrency = (existing.account?.baseCurrency || "EUR") as Currency;
    const formattedAmount = formatMoney(
        Number(existing.price),
        accountCurrency,
        accountCurrency === "ALL" ? "after" : "before"
    );

    if (existing.user.notifySubscriptionCancelled) {
        try {
            await sendSubscriptionCancelledEmail({
                to: existing.user.email,
                subscriptionName: existing.name,
                linkedAccountName,
                formattedAmount,
            });
        } catch (err) {
            console.error("Failed to send cancellation email:", err);
        }
    }

    return res.json({ subscription: updated });
}

export async function processDueSubscriptions(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    try {
        const result = await processDueSubscriptionsForUser(req.user.userId);
        return res.json({
            message: "Processed due subscriptions",
            ...result,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to process due subscriptions" });
    }
}

export async function processReminders(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    try {
        const result = await sendSubscriptionRemindersForUser(req.user.userId);
        return res.json({
            message: "Processed subscription reminders",
            ...result,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to process subscription reminders" });
    }
}