import { Request, Response } from "express";
import crypto from "crypto";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";
import { parseTransactionDate } from "../utils/dateHelper";
import {
  Currency,
  fetchExchangeRates,
  convertAmount,
  detectCurrency,
  formatMoney,
} from "../utils/formatMoney";

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
    "brunch", "delijorgji", "taverna", "pasticeri",
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

function cleanCardString(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[*#xX\s\-_]+\d{3,4}\b/g, "") // removes *7076, #9897, 2120 at end
    .replace(/[*#]/g, "")
    .replace(/\b(mastercard|visa|debit|credit|card|pass)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractDigits(str: string): string | null {
  if (!str) return null;
  const match = str.match(/\b\d{3,4}\b/);
  return match ? match[0] : null;
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

export interface ParsedNotification {
  amount?: number;
  currency?: Currency;
  merchant?: string;
  cardName?: string;
  cardDigits?: string;
}

export function parseTransactionFromText(rawText: string | string[] | any): ParsedNotification {
  if (!rawText) return {};

  let fullText = "";
  if (Array.isArray(rawText)) {
    fullText = rawText.map((t) => String(t || "").trim()).filter(Boolean).join(" ");
  } else if (rawText && typeof rawText === "object") {
    fullText = Object.values(rawText).map((t) => String(t || "").trim()).filter(Boolean).join(" ");
  } else {
    fullText = String(rawText).replace(/\r?\n+/g, " ").trim();
  }

  if (!fullText) return {};

  const lower = fullText.toLowerCase();
  const result: ParsedNotification = {};

  // Helper to map currency symbols/strings to Currency type
  const normalizeCurrencyCode = (c: string): Currency | undefined => {
    if (!c) return undefined;
    const upper = c.trim().toUpperCase();
    if (upper === "€" || upper === "EUR" || upper === "978") return "EUR";
    if (upper === "£" || upper === "GBP" || upper === "826") return "GBP";
    if (upper === "$" || upper === "USD" || upper === "840") return "USD";
    if (upper === "ALL" || upper === "LEK" || upper === "LEKE" || upper === "008") return "ALL";
    return undefined;
  };

  // Find the specific sentence or notification fragment that mentions payment / amount
  const paymentSegmentRegex = /(?:you paid|paid|spent|pages[eë]|blerje|transaksion|payment|purchase)[\s\S]{5,150}?(?=\.(?!\d)|\n|$)/i;
  const segmentMatch = fullText.match(paymentSegmentRegex);
  const targetText = segmentMatch ? segmentMatch[0] : fullText;

  // 1. Check for Dual Currency format: e.g. "£26.94 (ALL 2,872)" or "26.94 GBP (2,872 ALL)"
  const dualMatch = fullText.match(/(?:([£€$]|GBP|EUR|USD|ALL)\s*([\d,]+(?:\.\d+)?))\s*\((?:([£€$]|GBP|EUR|USD|ALL)\s*([\d,]+(?:\.\d+)?))\)/i);
  if (dualMatch) {
    const cur1 = normalizeCurrencyCode(dualMatch[1]);
    const amt1 = parseFloat(dualMatch[2].replace(/,/g, ""));
    const cur2 = normalizeCurrencyCode(dualMatch[3]);
    const amt2 = parseFloat(dualMatch[4].replace(/,/g, ""));

    // If card is Monzo (GBP account), prefer the billed GBP amount
    if (cur1 && !Number.isNaN(amt1) && amt1 > 0) {
      result.currency = cur1;
      result.amount = amt1;
    } else if (cur2 && !Number.isNaN(amt2) && amt2 > 0) {
      result.currency = cur2;
      result.amount = amt2;
    }
  }

  // 2. Single Currency & Amount extraction (paired together so currency symbol matches amount)
  if (!result.amount) {
    const currWithNumRegex = /(?:([€$£]|ALL|EUR|GBP|USD|LEK)\s*([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?))|([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)\s*([€$£]|ALL|EUR|GBP|USD|LEK)/i;
    let currMatch = targetText.match(currWithNumRegex) || fullText.match(currWithNumRegex);

    if (currMatch) {
      const matchedCur = currMatch[1] || currMatch[4];
      const rawNum = (currMatch[2] || currMatch[3] || "").replace(/[\s,]/g, "");
      const parsed = parseFloat(rawNum);
      if (!Number.isNaN(parsed) && parsed > 0) {
        result.amount = parsed;
        result.currency = normalizeCurrencyCode(matchedCur);
      }
    }
  }

  // Fallback standalone currency detection if amount was found without currency
  if (!result.currency) {
    if (/(\bALL\b|\bLEK\b|\bLEKE\b)/i.test(targetText) || /(\bALL\b|\bLEK\b|\bLEKE\b)/i.test(fullText)) {
      result.currency = "ALL";
    } else if (/(\bEUR\b|€)/i.test(targetText) || /(\bEUR\b|€)/i.test(fullText)) {
      result.currency = "EUR";
    } else if (/(\bGBP\b|£)/i.test(targetText) || /(\bGBP\b|£)/i.test(fullText)) {
      result.currency = "GBP";
    } else if (/(\bUSD\b|\$)/i.test(targetText) || /(\bUSD\b|\$)/i.test(fullText)) {
      result.currency = "USD";
    }
  }

  // Fallback number search if not found above
  if (!result.amount) {
    const verbMatch = fullText.match(/(?:paid|spent|vler[eë]|pages[eë]|blerje|amount|shum[aë]|euro|lek)\s*:?\s*([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i);
    if (verbMatch) {
      const parsed = parseFloat(verbMatch[1].replace(/[\s,]/g, ""));
      if (!Number.isNaN(parsed) && parsed > 0) {
        result.amount = parsed;
      }
    }
  }

  // 3. Card Digits or Bank Name
  const digitsMatch = fullText.match(/(?:\*|karten|kartes|card|ending|x+)\s*[*#\s]*([0-9]{4})\b/i);
  if (digitsMatch) {
    result.cardDigits = digitsMatch[1];
  }

  if (lower.includes("monzo")) {
    result.cardName = "Monzo Mastercard";
  } else if (lower.includes("yuh")) {
    result.cardName = "Yuh Debit Card";
  } else if (lower.includes("jet bank") || lower.includes("jetbank")) {
    result.cardName = result.currency === "ALL" ? "Jet Bank ALL" : "Jet Bank Eur";
  } else if (lower.includes("binance")) {
    result.cardName = "Binance";
  } else if (lower.includes("revolut")) {
    result.cardName = "Revolut";
  } else if (lower.includes("raiffeisen")) {
    result.cardName = "Raiffeisen";
  } else if (lower.includes("bkt")) {
    result.cardName = "BKT";
  } else if (lower.includes("credins")) {
    result.cardName = "Credins";
  } else if (lower.includes("intesa")) {
    result.cardName = "Intesa";
  } else if (lower.includes("otp")) {
    result.cardName = "OTP";
  }

  // 4. Extract Merchant
  // First check Monzo lock screen notification layout: "Monzo \n Rossman & Lala \n ALL 2,872"
  const monzoLayoutMatch = fullText.match(/Monzo\s+([A-Za-z0-9&.\- ]+?)\s+(?:ALL|EUR|GBP|USD|[€$£]|\d{1,2}:\d{2})/i);
  if (monzoLayoutMatch && monzoLayoutMatch[1].trim().length >= 2 && !/^(card|payment|mastercard|approved)$/i.test(monzoLayoutMatch[1].trim())) {
    result.merchant = monzoLayoutMatch[1].trim();
  }

  // Standard "at / to / tek / dyqani" pattern
  if (!result.merchant) {
    const triggerRegex = /(?:at|to|tek|te|tek dyqani|te tregtari|aprovuar tek|dyqani|merchant:?)\s+/i;
    const matchTrigger = targetText.match(triggerRegex) || fullText.match(triggerRegex);
    const sourceTextForMerchant = segmentMatch ? targetText : fullText;
    if (matchTrigger && matchTrigger.index !== undefined) {
      const after = sourceTextForMerchant.slice(matchTrigger.index + matchTrigger[0].length).trim();
      const stopWords = /(?:\s+(?:with|me|nga|on|using|approved|successful|dhe|date|sukses\w*|\*|\b\d{4}\b|\b\d+\s*(?:h|m|s|d|min|mins|hr|hrs|hour|hours|day|days)\s*ago\b|\b(?:yesterday|today|now)\b|\b\d{1,2}:\d{2}\b)[\s\S]*$)/i;
      const merchantCandidate = after.replace(stopWords, "").trim();
      if (merchantCandidate && merchantCandidate.length >= 2 && merchantCandidate.length <= 40) {
        if (!/^(the|a|an|me|te|tek|card|karten|kartes|your)$/i.test(merchantCandidate)) {
          result.merchant = merchantCandidate;
        }
      }
    }
  }

  // Final cleanup on merchant: strip any trailing relative time like "3h ago" or "now"
  if (result.merchant) {
    result.merchant = result.merchant
      .replace(/\s+\d+\s*(?:h|m|s|d|min|mins|hr|hrs|hour|hours|day|days)\s*ago\b/gi, "")
      .replace(/\s+(?:yesterday|today|now)\b/gi, "")
      .replace(/\s+\d{1,2}:\d{2}\b/g, "")
      .trim();
  }

  return result;
}

// Quick Expense Webhook (called by Apple Shortcuts or other webhooks)
export async function quickExpenseWebhook(req: Request, res: Response) {
  try {
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

    const rawInputText = req.body.text ?? req.body.rawText ?? req.body.notification ?? req.body.message;
    let parsedFromText: ParsedNotification = {};

    let normalizedInputText = "";
    if (Array.isArray(rawInputText)) {
      normalizedInputText = rawInputText.map((t) => String(t || "").trim()).filter(Boolean).join(" ");
    } else if (rawInputText && typeof rawInputText === "object") {
      normalizedInputText = Object.values(rawInputText).map((t) => String(t || "").trim()).filter(Boolean).join(" ");
    } else if (typeof rawInputText === "string") {
      normalizedInputText = rawInputText.trim();
    }

    if (normalizedInputText) {
      parsedFromText = parseTransactionFromText(normalizedInputText);
    }

    const { amount, currency, merchant, description, cardName, category, date } = req.body;

    const effectiveAmount = amount !== undefined && amount !== null && amount !== "" ? amount : parsedFromText.amount;
    const effectiveCurrency = currency || parsedFromText.currency;
    const effectiveMerchant = (merchant || parsedFromText.merchant || "").trim();
    const effectiveCardName = (cardName || parsedFromText.cardName || "").trim();
    const parsedDigits = parsedFromText.cardDigits;

    if (effectiveAmount === undefined || effectiveAmount === null || effectiveAmount === "") {
      const debugText = normalizedInputText ? `"${normalizedInputText.slice(0, 100)}"` : "(EMPTY/NO TEXT SENT)";
      return res.status(400).json({
        error: `Amount is required. Could not automatically extract an amount. Server received: ${debugText}`,
      });
    }

    // Parse amount cleanly (handling strings like "$15.50", "3,100", or "ALL 3,100")
    let cleanAmountStr = String(effectiveAmount).replace(/,/g, "").trim();
    const matchNum = cleanAmountStr.match(/-?\d+(\.\d+)?/);
    const numericAmount = matchNum ? Math.abs(parseFloat(matchNum[0])) : NaN;

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount value. Must be greater than 0." });
    }

    // Detect currency from explicit field, amount string, or parsed notification text
    let transactionCurrency = detectCurrency(effectiveCurrency, effectiveAmount) || parsedFromText.currency;

    // Determine raw merchant/description
    const baseDescription = (
      effectiveMerchant ||
      description ||
      (rawInputText ? rawInputText.slice(0, 45).trim() : "Card Transaction")
    ).trim();

    // Determine category
    const finalCategory =
      category && typeof category === "string" && category.trim() !== "Other"
        ? category.trim()
        : autoDetectCategory(baseDescription);

    // Parse transaction date
    let transactionDate = date ? parseTransactionDate(date) : new Date();

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

    if (effectiveCardName || parsedDigits) {
      const incomingCard = effectiveCardName || (parsedDigits ? `*${parsedDigits}` : "");
      const cardLower = incomingCard.toLowerCase();
      const cardClean = cleanCardString(incomingCard);
      const incomingDigits = extractDigits(incomingCard) || parsedDigits;

      // 0. Match by card digits if provided by notification OCR
      if (incomingDigits) {
        const digitMatch = cardMappings.find((m) => {
          const mapDigits = extractDigits(m.cardName);
          return mapDigits === incomingDigits;
        });
        if (digitMatch) {
          const found = accounts.find((a) => a.id === digitMatch.accountId);
          if (found) matchedAccount = found;
        }
      }

      // 1. Exact match in explicit card mappings
      if (!matchedAccount) {
        const exactMapping = cardMappings.find(
          (m) => m.cardName && m.cardName.trim().toLowerCase() === cardLower
        );
        if (exactMapping) {
          const found = accounts.find((a) => a.id === exactMapping.accountId);
          if (found) matchedAccount = found;
        }
      }

      // 2. Normalized card mapping match (e.g. "Monzo Mastercard *2120" matches "Monzo Mastercard")
      if (!matchedAccount) {
        const normalizedMatches = cardMappings.filter((m) => {
          if (!m.cardName) return false;
          const mappingClean = cleanCardString(m.cardName);
          if (mappingClean === cardClean) return true;
          if (mappingClean.includes(cardClean) || cardClean.includes(mappingClean)) return true;
          return false;
        });

        if (normalizedMatches.length === 1) {
          const found = accounts.find((a) => a.id === normalizedMatches[0].accountId);
          if (found) matchedAccount = found;
        } else if (normalizedMatches.length > 1) {
          // If multiple matches (e.g. two "Mastercard Debit" cards from Jet Bank)
          // A) Try matching digits if present in incoming card
          if (incomingDigits) {
            const digitMatch = normalizedMatches.find((m) => {
              const mapDigits = extractDigits(m.cardName);
              return mapDigits === incomingDigits;
            });
            if (digitMatch) {
              const found = accounts.find((a) => a.id === digitMatch.accountId);
              if (found) matchedAccount = found;
            }
          }

          // B) Try matching by transaction currency (e.g. ALL card vs EUR card)
          if (!matchedAccount && transactionCurrency) {
            const currMatch = normalizedMatches.find((m) => {
              const acc = accounts.find((a) => a.id === m.accountId);
              return acc && acc.baseCurrency.toUpperCase() === transactionCurrency?.toUpperCase();
            });
            if (currMatch) {
              const found = accounts.find((a) => a.id === currMatch.accountId);
              if (found) matchedAccount = found;
            }
          }

          // C) Fallback to first normalized match
          if (!matchedAccount) {
            const found = accounts.find((a) => a.id === normalizedMatches[0].accountId);
            if (found) matchedAccount = found;
          }
        }
      }

      // 3. Exact match against account name
      if (!matchedAccount) {
        const exactMatch = accounts.find((a) => a.name.toLowerCase() === cardLower);
        if (exactMatch) matchedAccount = exactMatch;
      }

      // 4. Partial keyword match (e.g. "Monzo" in "Monzo Mastercard")
      if (!matchedAccount) {
        const partialMatch = accounts.find((a) => {
          const accLower = a.name.toLowerCase();
          const accClean = cleanCardString(a.name);
          return (
            accLower.includes(cardLower) ||
            cardLower.includes(accLower) ||
            accClean.includes(cardClean) ||
            cardClean.includes(accClean)
          );
        });
        if (partialMatch) matchedAccount = partialMatch;
      }

      // 5. Transaction currency match (e.g. if currency is GBP and user has a Monzo GBP account)
      if (!matchedAccount && transactionCurrency) {
        const curCode: string = transactionCurrency;
        const currAccounts = accounts.filter(
          (a) => a.baseCurrency.toUpperCase() === curCode.toUpperCase()
        );
        if (currAccounts.length === 1) {
          matchedAccount = currAccounts[0];
        }
      }
    }

    // Handle unmapped card
    if (!matchedAccount) {
      // If default account is specified, use it
      if (defaultAccountId) {
        const def = accounts.find((a) => a.id === defaultAccountId);
        if (def) matchedAccount = def;
      }

      // If still unmapped and policy is ignore, skip safely
      if (!matchedAccount && unmappedAction === "ignore") {
        return res.status(200).json({
          success: true,
          ignored: true,
          message: `Transaction of ${numericAmount.toFixed(2)} at ${baseDescription} was skipped: Card "${effectiveCardName || cardName || "Unknown"}" is not linked to any Money Tracker account.`,
        });
      }

      // If policy is default or no mapping matched, use first account
      if (!matchedAccount) {
        matchedAccount = accounts[0];
      }
    }

    // Intelligent Currency Detection & Multi-Currency Conversion
    if (!transactionCurrency) {
      if (user.totalsMainCurrency && user.totalsMainCurrency !== matchedAccount.baseCurrency) {
        // If user's primary ledger currency is ALL, and the amount is typical of Lek (>= 100),
        // infer ALL rather than incorrectly treating a large Lek number as GBP/EUR
        if (user.totalsMainCurrency === "ALL" && numericAmount >= 100) {
          transactionCurrency = "ALL";
        } else {
          transactionCurrency = matchedAccount.baseCurrency as Currency;
        }
      } else {
        transactionCurrency = matchedAccount.baseCurrency as Currency;
      }
    }

    let finalDeductionAmount = numericAmount;
    let currencyNote = "";

    if (transactionCurrency && transactionCurrency !== matchedAccount.baseCurrency) {
      try {
        const rates = await fetchExchangeRates();
        finalDeductionAmount = convertAmount(
          numericAmount,
          transactionCurrency,
          matchedAccount.baseCurrency as Currency,
          rates
        );
        currencyNote = ` (${formatMoney(numericAmount, transactionCurrency)})`;
      } catch (rateErr) {
        console.error("Exchange rate conversion error:", rateErr);
        finalDeductionAmount = numericAmount;
      }
    }

    const finalDescription = (baseDescription + currencyNote).trim();

    // Automated card transactions have already completed at POS; record expense even if account balance is low
    const isOverdrawn = matchedAccount.balance < finalDeductionAmount;

    // Duplicate Protection (Idempotency)
    // If an identical transaction was recorded within the last 30 minutes, skip to prevent double-charging
    const recentThreshold = new Date(Date.now() - 30 * 60 * 1000);
    const existingDuplicate = await prisma.expense.findFirst({
      where: {
        userId: user.id,
        accountId: matchedAccount.id,
        amount: {
          gte: finalDeductionAmount - 0.01,
          lte: finalDeductionAmount + 0.01,
        },
        description: finalDescription,
        createdAt: { gte: recentThreshold },
      },
    });

    if (existingDuplicate) {
      const minutesAgo = Math.max(1, Math.round((Date.now() - existingDuplicate.createdAt.getTime()) / 60000));
      return res.status(200).json({
        success: true,
        duplicate: true,
        message: `Already recorded: "${finalDescription}" (${formatMoney(finalDeductionAmount, matchedAccount.baseCurrency as Currency)}) was already logged ${minutesAgo}m ago. Skipped duplicate.`,
        expense: existingDuplicate,
        account: {
          id: matchedAccount.id,
          name: matchedAccount.name,
          remainingBalance: matchedAccount.balance,
          currency: matchedAccount.baseCurrency,
        },
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedAccount = await tx.account.update({
        where: { id: matchedAccount.id },
        data: {
          balance: {
            decrement: finalDeductionAmount,
          },
        },
      });

      const expense = await tx.expense.create({
        data: {
          userId: user.id,
          amount: finalDeductionAmount,
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
      message: `Recorded ${formatMoney(finalDeductionAmount, matchedAccount.baseCurrency as Currency)} at ${baseDescription} under ${finalCategory} (${matchedAccount.name})${currencyNote ? ` converted from ${formatMoney(numericAmount, transactionCurrency!)}` : ""}`,
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
      error: err?.message || "Failed to process quick expense",
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

// Clean up test/accidental transactions and restore account balances
export async function cleanupTestTransactions(req: Request, res: Response) {
  try {
    const apiKey = extractApiKey(req);
    if (!apiKey) return res.status(401).json({ error: "Missing API key" });
    const user = await prisma.user.findFirst({ where: { apiKey } });
    if (!user) return res.status(401).json({ error: "Invalid API key" });

    const specificIds: number[] = Array.isArray(req.body.ids)
      ? req.body.ids.map(Number).filter((n: number) => !Number.isNaN(n))
      : [];

    let whereClause: any = {
      userId: user.id,
    };

    if (specificIds.length > 0) {
      whereClause.id = { in: specificIds };
    } else {
      whereClause.OR = [
        { description: { contains: "Spar (€ 0.01)" } },
        { description: { contains: "Sainsbury's" } },
        { description: { contains: "SPAR (ALL 3,500.00)" } },
        { description: "Test" },
      ];
    }

    const testExpenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        account: true,
      },
    });

    const refunded: any[] = [];
    for (const exp of testExpenses) {
      await prisma.$transaction(async (tx) => {
        if (exp.accountId) {
          await tx.account.update({
            where: { id: exp.accountId },
            data: { balance: { increment: exp.amount } },
          });
        }
        await tx.expense.delete({ where: { id: exp.id } });
      });
      refunded.push({
        id: exp.id,
        description: exp.description,
        amount: exp.amount,
        accountName: exp.account?.name,
        currency: exp.account?.baseCurrency,
      });
    }

    return res.json({
      success: true,
      message: `Cleaned up ${refunded.length} test transactions and refunded account balances.`,
      refunded,
    });
  } catch (err: any) {
    console.error("Cleanup error:", err);
    return res.status(500).json({ error: err.message || "Failed to cleanup transactions" });
  }
}

