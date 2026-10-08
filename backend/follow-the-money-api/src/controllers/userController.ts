import { Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";
import { sendVerificationCodeEmail } from "../lib/mailer";

const ALLOWED_CURRENCIES = ["ALL", "EUR", "GBP", "USD"] as const;

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashVerificationCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export const getMySettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        fullName: true,
        totalsMainCurrency: true,
        showSecondCurrency: true,
        secondCurrency: true,
        notifySubscriptionReminder: true,
        notifySubscriptionCreated: true,
        notifySubscriptionCancelled: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to load settings" });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { fullName } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (fullName !== undefined && typeof fullName !== "string") {
      return res.status(400).json({ error: "Full name must be a string" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(fullName !== undefined ? { fullName: fullName.trim() || null } : {}),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    return res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
};

export const requestEmailChangeCode = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { newEmail } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!newEmail || typeof newEmail !== "string") {
      return res.status(400).json({ error: "New email is required" });
    }

    const normalizedEmail = newEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ error: "New email is required" });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (normalizedEmail === currentUser.email.toLowerCase()) {
      return res.status(400).json({ error: "New email must be different" });
    }

    const existing = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        NOT: { id: userId },
      },
    });

    if (existing) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const code = generateVerificationCode();
    const codeHash = hashVerificationCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.pendingEmailChange.updateMany({
      where: {
        userId,
        used: false,
      },
      data: {
        used: true,
      },
    });

    await prisma.pendingEmailChange.create({
      data: {
        userId,
        newEmail: normalizedEmail,
        codeHash,
        expiresAt,
      },
    });

    await sendVerificationCodeEmail(normalizedEmail, code);

    return res.json({ message: "Verification code sent" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to send verification code" });
  }
};

export const confirmEmailChange = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { newEmail, code } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!newEmail || !code) {
      return res.status(400).json({ error: "New email and code are required" });
    }

    const normalizedEmail = String(newEmail).trim().toLowerCase();

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const existing = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        NOT: { id: userId },
      },
    });

    if (existing) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const pendingChange = await prisma.pendingEmailChange.findFirst({
      where: {
        userId,
        newEmail: normalizedEmail,
        used: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!pendingChange) {
      return res.status(400).json({ error: "Verification code not found" });
    }

    if (pendingChange.expiresAt < new Date()) {
      return res.status(400).json({ error: "Verification code expired" });
    }

    const codeHash = hashVerificationCode(String(code).trim());

    if (codeHash !== pendingChange.codeHash) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          email: normalizedEmail,
        },
      }),
      prisma.pendingEmailChange.update({
        where: { id: pendingChange.id },
        data: {
          used: true,
        },
      }),
    ]);

    return res.json({
      message: "Email updated successfully",
      user: {
        id: currentUser.id,
        email: normalizedEmail,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update email" });
  }
};

export const deleteMyAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to delete account" });
  }
};

export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      return res.status(400).json({ error: "Password fields must be strings" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!ok) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
      },
    });

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update password" });
  }
};

export const updatePreferences = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { totalsMainCurrency, showSecondCurrency, secondCurrency } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (
        typeof totalsMainCurrency !== "string" ||
        !ALLOWED_CURRENCIES.includes(totalsMainCurrency as any)
    ) {
      return res.status(400).json({ error: "Invalid main currency" });
    }

    if (typeof showSecondCurrency !== "boolean") {
      return res.status(400).json({ error: "showSecondCurrency must be boolean" });
    }

    if (showSecondCurrency) {
      if (
          typeof secondCurrency !== "string" ||
          !ALLOWED_CURRENCIES.includes(secondCurrency as any)
      ) {
        return res.status(400).json({ error: "Invalid second currency" });
      }

      if (secondCurrency === totalsMainCurrency) {
        return res.status(400).json({ error: "Second currency must be different from main currency" });
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        totalsMainCurrency,
        showSecondCurrency,
        secondCurrency: showSecondCurrency ? secondCurrency : null,
      },
      select: {
        totalsMainCurrency: true,
        showSecondCurrency: true,
        secondCurrency: true,
      },
    });

    return res.json({
      message: "Preferences updated successfully",
      preferences: updated,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update preferences" });
  }
};

export const updateNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const {
      notifySubscriptionReminder,
      notifySubscriptionCreated,
      notifySubscriptionCancelled,
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (
        typeof notifySubscriptionReminder !== "boolean" ||
        typeof notifySubscriptionCreated !== "boolean" ||
        typeof notifySubscriptionCancelled !== "boolean"
    ) {
      return res.status(400).json({
        error: "All notification settings must be boolean values",
      });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        notifySubscriptionReminder,
        notifySubscriptionCreated,
        notifySubscriptionCancelled,
      },
      select: {
        notifySubscriptionReminder: true,
        notifySubscriptionCreated: true,
        notifySubscriptionCancelled: true,
      },
    });

    return res.json({
      message: "Notification settings updated successfully",
      notifications: updated,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update notifications" });
  }
};

function sanitizeCsvField(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "number") return val.toString();
  let str = String(val);

  // Neutralize formula injection / DDE (CWE-1236):
  // If the cell begins with =, +, -, @, \t, or \r, prepend a single quote '
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // RFC 4180 escaping: If field contains comma, quote, or newline, escape quotes with "" and wrap in ""
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const exportUserData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [user, accounts, expenses, subscriptions, notes, accountActions] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            fullName: true,
            createdAt: true,
            totalsMainCurrency: true,
            showSecondCurrency: true,
            secondCurrency: true,
            notifySubscriptionReminder: true,
            notifySubscriptionCreated: true,
            notifySubscriptionCancelled: true,
          },
        }),
        prisma.account.findMany({
          where: { userId },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        }),
        prisma.expense.findMany({
          where: { userId },
          include: {
            account: {
              select: { id: true, name: true, baseCurrency: true },
            },
          },
          orderBy: { date: "desc" },
        }),
        prisma.subscription.findMany({
          where: { userId },
          include: {
            account: {
              select: { id: true, name: true, baseCurrency: true },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.note.findMany({
          where: { userId },
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        }),
        prisma.accountAction.findMany({
          where: { userId },
          include: {
            account: {
              select: { id: true, name: true, baseCurrency: true },
            },
            toAccount: {
              select: { id: true, name: true, baseCurrency: true },
            },
          },
          orderBy: { date: "desc" },
        }),
      ]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const dateStr = new Date().toISOString().split("T")[0];
    const format = String(req.query.format || "json").toLowerCase();

    // Cache-prevention headers for sensitive personal exports
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");

    if (format === "csv") {
      const headers = [
        "Date",
        "Type",
        "Account",
        "Category / Target",
        "Description",
        "Amount",
        "Currency",
        "Status",
      ];

      interface LedgerRow {
        date: string;
        type: string;
        account: string;
        categoryOrTarget: string;
        description: string;
        amount: number | string;
        currency: string;
        status: string;
        sortTimestamp: number;
      }

      const rows: LedgerRow[] = [];

      // 1. Expenses
      for (const exp of expenses) {
        const d = new Date(exp.date);
        rows.push({
          date: d.toISOString().split("T")[0],
          type: "Expense",
          account: exp.account?.name || "Unassigned",
          categoryOrTarget: exp.category,
          description: exp.description || "",
          amount: exp.amount,
          currency: exp.account?.baseCurrency || user.totalsMainCurrency || "EUR",
          status: "Completed",
          sortTimestamp: d.getTime(),
        });
      }

      // 2. Account Actions (Deposits, Withdrawals, Transfers)
      for (const act of accountActions) {
        const d = new Date(act.date);
        let target = "";
        if (act.toAccount) {
          target = act.toAccount.name;
        } else if (act.type === "DEPOSIT") {
          target = "Deposit";
        } else if (act.type === "WITHDRAWAL") {
          target = "Withdrawal";
        } else {
          target = act.type;
        }

        rows.push({
          date: d.toISOString().split("T")[0],
          type: act.type.replace(/_/g, " "),
          account: act.account?.name || "Unassigned",
          categoryOrTarget: target,
          description: act.description || "",
          amount: act.amount,
          currency: act.account?.baseCurrency || user.totalsMainCurrency || "EUR",
          status: "Completed",
          sortTimestamp: d.getTime(),
        });
      }

      // 3. Subscriptions
      for (const sub of subscriptions) {
        const d = sub.nextBillingDate ? new Date(sub.nextBillingDate) : new Date(sub.createdAt);
        rows.push({
          date: d.toISOString().split("T")[0],
          type: "Subscription",
          account: sub.account?.name || "Unassigned",
          categoryOrTarget: sub.billingPeriod,
          description: sub.name,
          amount: sub.price,
          currency: sub.account?.baseCurrency || user.totalsMainCurrency || "EUR",
          status: sub.status,
          sortTimestamp: d.getTime(),
        });
      }

      // 4. Notes
      for (const note of notes) {
        const d = note.dueDate ? new Date(note.dueDate) : new Date(note.createdAt);
        rows.push({
          date: d.toISOString().split("T")[0],
          type: `Note (${note.type})`,
          account: "",
          categoryOrTarget: note.personName || note.repeatPeriod,
          description: note.title + (note.description ? ` - ${note.description}` : ""),
          amount: note.amount !== null && note.amount !== undefined ? note.amount : "",
          currency: note.currency,
          status: note.status,
          sortTimestamp: d.getTime(),
        });
      }

      // Sort rows chronologically descending
      rows.sort((a, b) => b.sortTimestamp - a.sortTimestamp);

      const csvLines = [
        headers.map(sanitizeCsvField).join(","),
        ...rows.map((r) =>
          [
            sanitizeCsvField(r.date),
            sanitizeCsvField(r.type),
            sanitizeCsvField(r.account),
            sanitizeCsvField(r.categoryOrTarget),
            sanitizeCsvField(r.description),
            sanitizeCsvField(r.amount),
            sanitizeCsvField(r.currency),
            sanitizeCsvField(r.status),
          ].join(",")
        ),
      ];

      const csvContent = csvLines.join("\r\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="money-tracker-ledger-${dateStr}.csv"`
      );
      return res.send(csvContent);
    }

    // Default: JSON full personal data backup
    const exportPayload = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      profile: user,
      accounts,
      expenses,
      subscriptions,
      notes,
      accountActions,
    };

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="money-tracker-export-${dateStr}.json"`
    );
    return res.json(exportPayload);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to export personal data" });
  }
};
