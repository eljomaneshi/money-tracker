import { Request, Response } from "express";
import crypto from "crypto";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";

export interface ApplePayCardMapping {
  cardName: string;
  accountId: number;
}

export interface ApplePaySettings {
  unmappedAction: "ignore" | "default";
  defaultAccountId?: number | null;
  cardMappings: ApplePayCardMapping[];
}

// Category auto-classification keywords
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: [
    "spar", "conad", "carrefour", "supermarket", "market", "grocery", "groceries",
    "mulliri", "mon cheri", "starbucks", "coffee", "kafe", "cafe", "bar",
    "restaurant", "restorant", "buke", "furre", "bakery", "food", "burger",
    "pizza", "mcdonald", "kfc", "sushi", "deli", "lounge", "bistro", "tavern",
    "patisserie", "crepe", "uber eats", "wolt", "glovo", "deliveroo", "doordash",
  ],
  Transport: [
    "uber", "bolt", "taxi", "shell", "kastrati", "alpet", "petrol", "gas",
    "fuel", "karburant", "parking", "train", "bus", "metro", "transit",
    "ryanair", "wizz", "airline", "airport", "toll", "easyjet", "lufthansa",
  ],
  Shopping: [
    "zara", "mango", "bershka", "pull&bear", "stradivarius", "massimo", "h&m",
    "amazon", "apple", "shein", "store", "boutique", "mall", "teg", "qtu",
    "ring", "toptani", "clothes", "shoes", "fashion", "ikea", "jysk", "altex",
    "neptun", "walmart", "target", "aliexpress", "ebay",
  ],
  Bills: [
    "vodafone", "one albania", "telecom", "oshee", "ukt", "electric", "water",
    "internet", "digialb", "tring", "utility", "bills", "tax", "tatime",
    "council", "energy", "enel", "pg&e",
  ],
  Subscriptions: [
    "netflix", "spotify", "apple.com/bill", "youtube", "chatgpt", "openai",
    "claude", "anthropic", "github", "adobe", "prime", "disney", "hbo",
    "playstation", "xbox", "patreon", "substack", "medium", "icloud",
  ],
  Entertainment: [
    "cinema", "cineplexx", "theatre", "concert", "ticket", "event", "pub",
    "club", "game", "steam", "bowling", "museum", "festival",
  ],
};

function autoDetectCategory(text: string): string {
  if (!text) return "Other";
  const normalized = text.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return category;
      }
    }
  }

  return "Other";
}

function extractApiKey(req: Request): string | null {
  const headerKey = req.header("x-api-key");
  if (headerKey && headerKey.trim()) {
    return headerKey.trim();
  }

  const authHeader = req.header("authorization");
  if (authHeader) {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && (parts[0] === "Bearer" || parts[0] === "ApiKey")) {
      return parts[1].trim();
    }
  }

  const queryKey = req.query.apiKey;
  if (typeof queryKey === "string" && queryKey.trim()) {
    return queryKey.trim();
  }

  return null;
}

// Quick Expense Webhook (called by Apple Shortcuts or other webhooks)
export async function quickExpenseWebhook(req: Request, res: Response) {
  const apiKey = extractApiKey(req);

  if (!apiKey) {
    return res.status(401).json({
      error: "Missing API Key. Provide it in X-API-Key header or Authorization: Bearer <key>.",
    });
  }

  const user = await prisma.user.findFirst({
    where: { apiKey },
  });

  if (!user) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  const { amount, merchant, description, cardName, category, date } = req.body;

  if (amount === undefined || amount === null || amount === "") {
    return res.status(400).json({ error: "amount is required" });
  }

  // Parse amount cleanly (handling strings like "$15.50" or "1,200.50")
  let cleanAmountStr = String(amount).replace(/,/g, "").trim();
  const matchNum = cleanAmountStr.match(/-?\d+(\.\d+)?/);
  const numericAmount = matchNum ? Math.abs(parseFloat(matchNum[0])) : NaN;

  if (Number.isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: "Invalid amount value. Must be greater than 0." });
  }

  // Determine merchant/description
  const finalDescription = (merchant || description || "Apple Pay Transaction").trim();

  // Determine category
  const finalCategory =
    category && typeof category === "string" && category.trim() !== "Other"
      ? category.trim()
      : autoDetectCategory(finalDescription);

  // Parse transaction date
  let transactionDate = new Date();
  if (date) {
    const parsedDate = new Date(date);
    if (!Number.isNaN(parsedDate.getTime())) {
      transactionDate = parsedDate;
    }
  }

  // Find user's active accounts
  const accounts = await prisma.account.findMany({
    where: {
      userId: user.id,
      deletedAt: null,
    },
    orderBy: { sortOrder: "asc" },
  });

  if (accounts.length === 0) {
    return res.status(400).json({
      error: "No active accounts found in your MoneyTracker ledger. Please add an account first.",
    });
  }

  // Parse user's Apple Pay multi-card settings
  const rawSettings = (user.applePaySettings as any) || {};
  const unmappedAction: "ignore" | "default" = rawSettings.unmappedAction || "ignore";
  const defaultAccountId: number | null = rawSettings.defaultAccountId || null;
  const cardMappings: ApplePayCardMapping[] = Array.isArray(rawSettings.cardMappings)
    ? rawSettings.cardMappings
    : [];

  // Match account
  let matchedAccount: typeof accounts[0] | null = null;

  if (cardName && typeof cardName === "string" && cardName.trim()) {
    const cardLower = cardName.trim().toLowerCase();

    // 1. Explicit user card mapping
    const explicitMapping = cardMappings.find(
      (m) => m.cardName && m.cardName.trim().toLowerCase() === cardLower
    );
    if (explicitMapping) {
      const found = accounts.find((a) => a.id === explicitMapping.accountId);
      if (found) matchedAccount = found;
    }

    // 2. Exact match against account name
    if (!matchedAccount) {
      const exactMatch = accounts.find((a) => a.name.toLowerCase() === cardLower);
      if (exactMatch) matchedAccount = exactMatch;
    }

    // 3. Partial keyword match (e.g. "BKT" in "BKT Visa Gold")
    if (!matchedAccount) {
      const partialMatch = accounts.find(
        (a) => a.name.toLowerCase().includes(cardLower) || cardLower.includes(a.name.toLowerCase())
      );
      if (partialMatch) matchedAccount = partialMatch;
    }

    // 4. Currency match
    if (!matchedAccount) {
      const currencyMatch = accounts.find((a) => a.baseCurrency.toLowerCase() === cardLower);
      if (currencyMatch) matchedAccount = currencyMatch;
    }
  }

  // Handle unmapped card
  if (!matchedAccount) {
    if (unmappedAction === "ignore") {
      return res.status(200).json({
        success: true,
        ignored: true,
        message: `Transaction of ${numericAmount.toFixed(2)} at ${finalDescription} was skipped: Card "${cardName || "Unknown"}" is not linked to any Money Tracker account.`,
      });
    }

    // Fall back to default account if specified
    if (defaultAccountId) {
      const def = accounts.find((a) => a.id === defaultAccountId);
      if (def) matchedAccount = def;
    }

    // If still null, fall back to first account
    if (!matchedAccount) {
      matchedAccount = accounts[0];
    }
  }

  // Balance Check (Prevent negative account balance)
  if (matchedAccount.balance < numericAmount) {
    return res.status(400).json({
      error: `Insufficient balance in ${matchedAccount.name}. Available balance is ${matchedAccount.balance.toFixed(2)} ${matchedAccount.baseCurrency}, but transaction requires ${numericAmount.toFixed(2)} ${matchedAccount.baseCurrency}. Transaction rejected.`,
    });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const updatedAccount = await tx.account.update({
        where: { id: matchedAccount.id },
        data: {
          balance: {
            decrement: numericAmount,
          },
        },
      });

      const expense = await tx.expense.create({
        data: {
          userId: user.id,
          amount: numericAmount,
          date: transactionDate,
          category: finalCategory,
          description: finalDescription,
          accountId: matchedAccount.id,
        },
      });

      return { expense, updatedAccount };
    });

    return res.status(201).json({
      success: true,
      message: `Recorded ${numericAmount.toFixed(2)} ${matchedAccount.baseCurrency} at ${finalDescription} under ${finalCategory} (${matchedAccount.name})`,
      expense: result.expense,
      account: {
        id: result.updatedAccount.id,
        name: result.updatedAccount.name,
        remainingBalance: result.updatedAccount.balance,
        currency: result.updatedAccount.baseCurrency,
      },
    });
  } catch (err: any) {
    console.error("Quick expense webhook error:", err);
    return res.status(500).json({
      error: err.message || "Failed to process quick expense",
    });
  }
}

// User API Key Management (Authenticated by session)
export async function getApiKey(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { apiKey: true },
    });

    return res.json({ apiKey: user?.apiKey || null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to load API key" });
  }
}

export async function generateApiKey(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const newKey = `mt_live_${crypto.randomBytes(24).toString("hex")}`;

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { apiKey: newKey },
      select: { apiKey: true },
    });

    return res.json({
      message: "API key generated successfully",
      apiKey: user.apiKey,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to generate API key" });
  }
}

export async function revokeApiKey(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  try {
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { apiKey: null },
    });

    return res.json({ message: "API key revoked successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to revoke API key" });
  }
}

// Get Integration & Apple Pay Multi-Card Settings
export async function getIntegrationSettings(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        apiKey: true,
        applePaySettings: true,
      },
    });

    const parsedSettings = (user?.applePaySettings as any) || {};

    return res.json({
      apiKey: user?.apiKey || null,
      settings: {
        unmappedAction: parsedSettings.unmappedAction || "ignore",
        defaultAccountId: parsedSettings.defaultAccountId || null,
        cardMappings: Array.isArray(parsedSettings.cardMappings)
          ? parsedSettings.cardMappings
          : [],
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to load integration settings" });
  }
}

// Update Apple Pay Multi-Card Settings
export async function updateIntegrationSettings(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const { unmappedAction, defaultAccountId, cardMappings } = req.body;

  const validUnmappedAction =
    unmappedAction === "default" ? "default" : "ignore";

  const cleanMappings: ApplePayCardMapping[] = Array.isArray(cardMappings)
    ? cardMappings
        .filter((m) => m && typeof m.cardName === "string" && m.cardName.trim() && typeof m.accountId === "number")
        .map((m) => ({
          cardName: m.cardName.trim(),
          accountId: m.accountId,
        }))
    : [];

  try {
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        applePaySettings: {
          unmappedAction: validUnmappedAction,
          defaultAccountId: defaultAccountId ? Number(defaultAccountId) : null,
          cardMappings: cleanMappings,
        } as any,
      },
      select: { applePaySettings: true },
    });

    return res.json({
      message: "Apple Pay settings saved successfully",
      settings: user.applePaySettings,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to save integration settings" });
  }
}
