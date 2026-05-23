import prisma from "../prisma";
import { sendSubscriptionReminderEmail } from "./emailService";
import { formatMoney, Currency } from "../utils/formatMoney";

function startOfDay(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function diffInDays(from: Date, to: Date) {
    const msPerDay = 1000 * 60 * 60 * 24;
    const fromDay = startOfDay(from).getTime();
    const toDay = startOfDay(to).getTime();
    return Math.round((toDay - fromDay) / msPerDay);
}

async function claim3DayReminder(subscriptionId: number, nextBillingDate: Date) {
    const result = await prisma.subscription.updateMany({
        where: {
            id: subscriptionId,
            OR: [
                { reminder3DaysSentFor: null },
                { reminder3DaysSentFor: { not: nextBillingDate } },
            ],
        },
        data: {
            reminder3DaysSentFor: nextBillingDate,
        },
    });

    return result.count === 1;
}

async function claim1DayReminder(subscriptionId: number, nextBillingDate: Date) {
    const result = await prisma.subscription.updateMany({
        where: {
            id: subscriptionId,
            OR: [
                { reminder1DaySentFor: null },
                { reminder1DaySentFor: { not: nextBillingDate } },
            ],
        },
        data: {
            reminder1DaySentFor: nextBillingDate,
        },
    });

    return result.count === 1;
}

export async function sendSubscriptionRemindersForUser(userId: number) {
    const today = new Date();

    const subscriptions = await prisma.subscription.findMany({
        where: {
            userId,
            status: "ACTIVE",
        },
        include: {
            user: {
                select: {
                    email: true,
                    notifySubscriptionReminder: true,
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

    let sent3Day = 0;
    let sent1Day = 0;

    for (const sub of subscriptions) {
        if (!sub.user.notifySubscriptionReminder) {
            continue;
        }

        const daysUntilRenewal = diffInDays(today, sub.nextBillingDate);
        const linkedAccountName = sub.account?.name || "No linked account";
        const accountCurrency = (sub.account?.baseCurrency || "EUR") as Currency;
        const formattedAmount = formatMoney(
            Number(sub.price),
            accountCurrency,
            accountCurrency === "ALL" ? "after" : "before"
        );

        if (daysUntilRenewal === 3) {
            const claimed = await claim3DayReminder(sub.id, sub.nextBillingDate);

            if (claimed) {
                try {
                    await sendSubscriptionReminderEmail({
                        to: sub.user.email,
                        subscriptionName: sub.name,
                        nextBillingDate: sub.nextBillingDate,
                        daysBefore: 3,
                        linkedAccountName,
                        formattedAmount,
                    });

                    sent3Day += 1;
                } catch (err) {
                    await prisma.subscription.update({
                        where: { id: sub.id },
                        data: {
                            reminder3DaysSentFor: null,
                        },
                    });

                    throw err;
                }
            }
        }

        if (daysUntilRenewal === 1) {
            const claimed = await claim1DayReminder(sub.id, sub.nextBillingDate);

            if (claimed) {
                try {
                    await sendSubscriptionReminderEmail({
                        to: sub.user.email,
                        subscriptionName: sub.name,
                        nextBillingDate: sub.nextBillingDate,
                        daysBefore: 1,
                        linkedAccountName,
                        formattedAmount,
                    });

                    sent1Day += 1;
                } catch (err) {
                    await prisma.subscription.update({
                        where: { id: sub.id },
                        data: {
                            reminder1DaySentFor: null,
                        },
                    });

                    throw err;
                }
            }
        }
    }

    return {
        sent3Day,
        sent1Day,
        totalChecked: subscriptions.length,
    };
}