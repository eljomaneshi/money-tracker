import nodemailer from "nodemailer";
import {EMAIL_PORT, EMAIL_SECURE} from "../config";

function getTransporter() {
    const EMAIL_HOST = process.env.EMAIL_HOST || "";
    const EMAIL_USER = process.env.EMAIL_USER || "";
    const EMAIL_PASS = process.env.EMAIL_PASS || "";
    const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

    const isEmailConfigured =
        !!EMAIL_HOST && !!EMAIL_PORT && !!EMAIL_USER && !!EMAIL_PASS;

    if (!isEmailConfigured) {
        throw new Error("Email is not configured. Check EMAIL_* environment variables.");
    }

    const transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        secure: EMAIL_SECURE,
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
        },
    });

    return {
        transporter,
        emailFrom: EMAIL_FROM,
    };
}

function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function buildStatusBadge(
    label: string,
    background: string,
    color: string
) {
    return `
    <span style="
      display: inline-block;
      padding: 6px 12px;
      border-radius: 999px;
      background: ${background};
      color: ${color};
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    ">
      ${escapeHtml(label)}
    </span>
  `;
}

function buildInfoRow(label: string, value: string) {
    return `
    <tr>
      <td style="padding: 10px 0; color: #64748b; font-size: 14px; width: 42%; vertical-align: top;">
        ${escapeHtml(label)}
      </td>
      <td style="padding: 10px 0; color: #0f172a; font-size: 14px; font-weight: 600; vertical-align: top;">
        ${value}
      </td>
    </tr>
  `;
}

function buildEmailLayout({
                              preheader,
                              title,
                              badge,
                              intro,
                              detailsTable,
                              note,
                          }: {
    preheader: string;
    title: string;
    badge: string;
    intro: string;
    detailsTable: string;
    note: string;
}) {
    return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(title)}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: Arial, Helvetica, sans-serif; color: #0f172a;">
      <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">
        ${escapeHtml(preheader)}
      </div>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; margin: 0; padding: 24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0;">
              <tr>
                <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 28px 32px;">
                  <div style="font-size: 13px; letter-spacing: 1.6px; text-transform: uppercase; color: #bfdbfe; font-weight: 700; margin-bottom: 10px;">
                    Follow The Money
                  </div>
                  <div style="font-size: 28px; line-height: 1.25; font-weight: 800; color: #ffffff; margin-bottom: 10px;">
                    ${escapeHtml(title)}
                  </div>
                  <div>
                    ${badge}
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding: 32px;">
                  <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.7; color: #334155;">
                    ${intro}
                  </p>

                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px 20px;">
                    ${detailsTable}
                  </table>

                  <div style="margin-top: 24px; padding: 16px 18px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 14px; font-size: 14px; line-height: 1.7; color: #1e3a8a;">
                    ${note}
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding: 0 32px 28px 32px;">
                  <div style="height: 1px; background: #e2e8f0; margin-bottom: 18px;"></div>
                  <p style="margin: 0; font-size: 12px; line-height: 1.7; color: #64748b;">
                    This is an automated transactional email from Follow The Money.
                  </p>
                  <p style="margin: 6px 0 0 0; font-size: 12px; line-height: 1.7; color: #94a3b8;">
                    You are receiving this because of activity on your finance account.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}

type ReminderEmailParams = {
    to: string;
    subscriptionName: string;
    nextBillingDate: Date;
    daysBefore: 3 | 1;
    linkedAccountName: string;
    formattedAmount: string;
};

export async function sendSubscriptionReminderEmail({
                                                        to,
                                                        subscriptionName,
                                                        nextBillingDate,
                                                        daysBefore,
                                                        linkedAccountName,
                                                        formattedAmount,
                                                    }: ReminderEmailParams) {
    const {transporter, emailFrom} = getTransporter();

    const formattedDate = formatDate(nextBillingDate);
    const escapedName = escapeHtml(subscriptionName);

    const subject =
        daysBefore === 3
            ? `Reminder: ${subscriptionName} renews in 3 days`
            : `Reminder: ${subscriptionName} renews tomorrow`;

    const badge =
        daysBefore === 3
            ? buildStatusBadge("3-Day Reminder", "#fef3c7", "#92400e")
            : buildStatusBadge("1-Day Reminder", "#fee2e2", "#991b1b");

    const html = buildEmailLayout({
        preheader: `${subscriptionName} renews on ${formattedDate}.`,
        title: "Subscription Reminder",
        badge,
        intro: `Your subscription <strong>${escapedName}</strong> is approaching its renewal date. We wanted to give you a quick heads-up so you can review your linked account in time.`,
        detailsTable: `
      ${buildInfoRow("Subscription", `<span>${escapedName}</span>`)}
      ${buildInfoRow("Renewal date", `<span>${formattedDate}</span>`)}
      ${buildInfoRow("Reminder timing", `<span>${daysBefore} day${daysBefore === 1 ? "" : "s"} before renewal</span>`)}
      ${buildInfoRow("Linked account", `<span>${escapeHtml(linkedAccountName)}</span>`)}
      ${buildInfoRow("Amount", `<span>${escapeHtml(formattedAmount)}</span>`)}
    `,
        note: `Open <strong>Follow The Money</strong> to review the linked account balance and make sure everything is ready before the payment is processed.`,
    });

    await transporter.sendMail({
        from: emailFrom,
        to,
        subject,
        html,
    });
}

type CancelledEmailParams = {
    to: string;
    subscriptionName: string;
    linkedAccountName?: string | null;
    formattedAmount?: string | null;
};

export async function sendSubscriptionCancelledEmail({
                                                         to,
                                                         subscriptionName,
                                                         linkedAccountName,
                                                         formattedAmount,
                                                     }: CancelledEmailParams) {
    const {transporter, emailFrom} = getTransporter();

    const escapedName = escapeHtml(subscriptionName);

    const extraRows = `
    ${linkedAccountName ? buildInfoRow("Linked account", `<span>${escapeHtml(linkedAccountName)}</span>`) : ""}
    ${formattedAmount ? buildInfoRow("Amount", `<span>${escapeHtml(formattedAmount)}</span>`) : ""}
  `;

    const subject = `Subscription cancelled: ${subscriptionName}`;

    const html = buildEmailLayout({
        preheader: `${subscriptionName} has been cancelled successfully.`,
        title: "Subscription Cancelled",
        badge: buildStatusBadge("Cancelled", "#fee2e2", "#991b1b"),
        intro: `Your subscription <strong>${escapedName}</strong> has been cancelled successfully and is no longer active in your subscription list.`,
        detailsTable: `
      ${buildInfoRow("Subscription", `<span>${escapedName}</span>`)}
      ${buildInfoRow("Status", `<span>Cancelled</span>`)}
      ${extraRows}
    `,
        note: `You will no longer receive future renewal reminders for this subscription unless it is created again later.`,
    });

    await transporter.sendMail({
        from: emailFrom,
        to,
        subject,
        html,
    });
}

type CreatedEmailParams = {
    to: string;
    subscriptionName: string;
    billingPeriod: string;
    nextBillingDate: Date;
    linkedAccountName: string;
    formattedAmount: string;
};

export async function sendSubscriptionCreatedEmail({
                                                       to,
                                                       subscriptionName,
                                                       billingPeriod,
                                                       nextBillingDate,
                                                       linkedAccountName,
                                                       formattedAmount,
                                                   }: CreatedEmailParams) {
    const {transporter, emailFrom} = getTransporter();

    const formattedDate = formatDate(nextBillingDate);
    const escapedName = escapeHtml(subscriptionName);

    const subject = `Subscription created: ${subscriptionName}`;

    const html = buildEmailLayout({
        preheader: `${subscriptionName} was added successfully.`,
        title: "New Subscription Added",
        badge: buildStatusBadge("Created", "#dcfce7", "#166534"),
        intro: `A new subscription <strong>${escapedName}</strong> has been added successfully to your Follow The Money account.`,
        detailsTable: `
      ${buildInfoRow("Subscription", `<span>${escapedName}</span>`)}
      ${buildInfoRow("Billing period", `<span>${escapeHtml(billingPeriod)}</span>`)}
      ${buildInfoRow("Next billing date", `<span>${formattedDate}</span>`)}
      ${buildInfoRow("Linked account", `<span>${escapeHtml(linkedAccountName)}</span>`)}
      ${buildInfoRow("Amount", `<span>${escapeHtml(formattedAmount)}</span>`)}
    `,
        note: `You will automatically receive reminder emails before renewal when this subscription reaches the 3-day and 1-day reminder windows.`,
    });

    await transporter.sendMail({
        from: emailFrom,
        to,
        subject,
        html,
    });
}