import prisma from "../prisma";

function addPeriod(date: Date, billingPeriod: "MONTHLY" | "YEARLY") {
    const d = new Date(date);

    if (billingPeriod === "MONTHLY") {
        const next = new Date(d);
        next.setMonth(next.getMonth() + 1);
        return next;
    }

    const next = new Date(d);
    next.setFullYear(next.getFullYear() + 1);
    return next;
}

export async function processDueSubscriptionsForUser(userId: number) {
    const now = new Date();

    const dueSubscriptions = await prisma.subscription.findMany({
        where: {
            userId,
            status: "ACTIVE",
            nextBillingDate: {
                lte: now,
            },
            accountId: {
                not: null,
            },
        },
    });

    for (const sub of dueSubscriptions) {
        await prisma.$transaction(async (tx) => {
            const account = await tx.account.findFirst({
                where: {
                    id: sub.accountId!,
                    userId,
                },
            });

            if (!account) {
                return;
            }

            const newNextBillingDate = addPeriod(
                sub.nextBillingDate,
                sub.billingPeriod as "MONTHLY" | "YEARLY"
            );

            await tx.account.update({
                where: { id: account.id },
                data: {
                    balance: account.balance - sub.price,
                },
            });

            await tx.expense.create({
                data: {
                    userId,
                    amount: sub.price,
                    category: "Subscriptions",
                    description: `${sub.name} subscription payment`,
                    date: sub.nextBillingDate,
                    accountId: sub.accountId,
                },
            });

            await tx.subscription.update({
                where: { id: sub.id },
                data: {
                    nextBillingDate: newNextBillingDate,
                    reminder3DaysSentFor: null,
                    reminder1DaySentFor: null,
                },
            });
        });
    }

    return { processed: dueSubscriptions.length };
}