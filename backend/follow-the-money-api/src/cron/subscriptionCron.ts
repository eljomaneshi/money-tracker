import cron from "node-cron";
import prisma from "../prisma";
import { processDueSubscriptionsForUser } from "../services/subscriptionBilling";
import { sendSubscriptionRemindersForUser } from "../services/subscriptionReminder";

export function startSubscriptionCron() {
    cron.schedule("0 3 * * *", async () => {
        console.log("Running daily subscription reminder + billing job...");

        try {
            const users = await prisma.user.findMany({
                select: { id: true, email: true },
            });

            for (const user of users) {
                try {
                    const reminderResult = await sendSubscriptionRemindersForUser(user.id);
                    console.log(
                        `Reminders for user ${user.email}: 3-day=${reminderResult.sent3Day}, 1-day=${reminderResult.sent1Day}, checked=${reminderResult.totalChecked}`
                    );
                } catch (err) {
                    console.error(`Reminder job failed for user ${user.email}:`, err);
                }

                try {
                    const billingResult = await processDueSubscriptionsForUser(user.id);
                    console.log(
                        `Billing for user ${user.email}: processed=${billingResult.processed}`
                    );
                } catch (err) {
                    console.error(`Billing job failed for user ${user.email}:`, err);
                }
            }

            console.log("Subscription reminder + billing job finished.");
        } catch (err) {
            console.error("Subscription cron failed:", err);
        }
    });
}