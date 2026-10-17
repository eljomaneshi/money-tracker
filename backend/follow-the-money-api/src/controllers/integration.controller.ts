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
    "neptun", "walmart", "target", "aliexpress", "ebay", "rossman", "rossmann",
    "temu", "hondos",
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
    const trimmed = authHeader.trim();
    const parts = trimmed.split(/\s+/);
    if (parts.length === 2 && (parts[0] === "Bearer" || parts[0] === "ApiKey")) {
      return parts[1].trim();
    }
    if (parts.length === 1 && (parts[0].startsWith("mt_") || parts[0].length > 10)) {
      return parts[0].trim();
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
  date?: Date;
  isRefund?: boolean;
  status?: string;
}

// Check if raw OCR text is from an Apple Wallet transaction detail screen
export function isAppleWalletReceipt(text: string): boolean {
  if (!text) return false;
  const normalized = String(text);
  const hasStatus = /status:\s*(approved|refunded|refund|pending|declined|completed)/i.test(normalized);
  const hasTotal = /\btotal\b\s*(?:[:=]|\s)?\s*(?:[+]?\s*(?:[€$£]|ALL|EUR|GBP|USD|LEK)\s*[\d,]+|[\d,]+\s*(?:[€$£]|ALL|EUR|GBP|USD|LEK))/i.test(normalized);
  const hasWalletKeywords = /(view in .* app|contact (monzo|jet bank|yuh|bkt|revolut|raiffeisen|bank)|report incorrect merchant info|wallet uses maps)/i.test(normalized);

  return (hasStatus && (hasTotal || hasWalletKeywords)) || (hasTotal && hasWalletKeywords);
}

// Parses full Apple Wallet transaction screen text with exact merchant, date, amount, card, and refund detection
export function parseAppleWalletReceipt(rawText: string): ParsedNotification {
  const normalized = String(rawText).replace(/\r\n/g, "\n");
  const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean);
  const result: ParsedNotification = {};

  // 1. Detect Refund
  const statusMatch = normalized.match(/status:\s*([A-Za-z]+)/i);
  if (statusMatch) {
    result.status = statusMatch[1].trim();
    if (/refund/i.test(result.status) || /rimburs/i.test(result.status)) {
      result.isRefund = true;
    }
  }

  // 2. Find Date Line (e.g. "16/10/2026, 20:23")
  const dateRegex = /\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})(?:[,\s]+(?:at\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?)?\b/;
  let dateLineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(dateRegex);
    if (match) {
      dateLineIdx = i;
      result.date = parseTransactionDate(match[0]);
      break;
    }
  }

  // 3. Merchant: In Apple Wallet layout, the merchant name sits directly above the date line
  if (dateLineIdx > 0) {
    const candidate = lines[dateLineIdx - 1];
    const cleaned = candidate.replace(/^[\s<>\-–•]+/, "").trim();
    if (cleaned && !/^(status:|total\b|[€$£]|all\b|eur\b|gbp\b|usd\b|<)/i.test(cleaned)) {
      result.merchant = cleaned;
    }
  }

  // 4. Amount & Currency: Scan lines above the merchant/date line for the main large amount
  const currNumRegex = /(?:([€$£]|ALL|EUR|GBP|USD|LEK)\s*([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?))|([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)\s*([€$£]|ALL|EUR|GBP|USD|LEK)/i;
  const searchLimit = dateLineIdx > 0 ? dateLineIdx : lines.length;

  for (let i = 0; i < searchLimit; i++) {
    const line = lines[i];
    if (line.includes("+")) {
      result.isRefund = true;
    }
    const match = line.match(currNumRegex);
    if (match && !/total/i.test(line)) {
      const cur = match[1] || match[4];
      const rawNum = (match[2] || match[3] || "").replace(/[\s,]/g, "");
      const amt = parseFloat(rawNum);
      if (!Number.isNaN(amt) && amt > 0) {
        result.amount = amt;
        const upperCur = cur.toUpperCase();
        if (upperCur === "€" || upperCur === "EUR") result.currency = "EUR";
        else if (upperCur === "£" || upperCur === "GBP") result.currency = "GBP";
        else if (upperCur === "$" || upperCur === "USD") result.currency = "USD";
        else if (upperCur === "ALL" || upperCur === "LEK") result.currency = "ALL";
        break;
      }
    }
  }

  // Fallback: check "Total ..." line if amount was not found above
  if (!result.amount) {
    const totalLine = lines.find((l) => /^total\b/i.test(l));
    if (totalLine) {
      if (totalLine.includes("+")) result.isRefund = true;
      const match = totalLine.match(currNumRegex);
      if (match) {
        const cur = match[1] || match[4];
        const rawNum = (match[2] || match[3] || "").replace(/[\s,]/g, "");
        const amt = parseFloat(rawNum);
        if (!Number.isNaN(amt) && amt > 0) {
          result.amount = amt;
          const upperCur = cur.toUpperCase();
          if (upperCur === "€" || upperCur === "EUR") result.currency = "EUR";
          else if (upperCur === "£" || upperCur === "GBP") result.currency = "GBP";
          else if (upperCur === "$" || upperCur === "USD") result.currency = "USD";
          else if (upperCur === "ALL" || upperCur === "LEK") result.currency = "ALL";
        }
      }
    }
  }

  // 5. Card Name & Bank
  const lower = normalized.toLowerCase();
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

  if (!result.cardName) {
    for (const line of lines) {
      if (/mastercard|visa|debit|credit/i.test(line) && !/status|total/i.test(line)) {
        result.cardName = line;
        break;
      }
    }
  }

  return result;
}

export function parseTransactionFromText(rawText: string | string[] | any): ParsedNotification {
  if (!rawText) return {};

  let fullText = "";
  if (Array.isArray(rawText)) {
    fullText = rawText.map((t) => String(t || "").trim()).filter(Boolean).join("\n");
  } else if (rawText && typeof rawText === "object") {
    fullText = Object.values(rawText).map((t) => String(t || "").trim()).filter(Boolean).join("\n");
  } else {
    fullText = String(rawText).trim();
  }

  if (!fullText) return {};

  // 0. Priority: If this is an Apple Wallet transaction screen, use specialized receipt parser
  if (isAppleWalletReceipt(fullText)) {
    const walletResult = parseAppleWalletReceipt(fullText);
    if (walletResult && walletResult.amount) {
      return walletResult;
    }
  }

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

  // Detect Refund keywords
  if (/\b(refund|refunded|reversal|rimbursim|rimbursuar)\b/i.test(fullText) || /^\s*\+\s*(?:[€$£]|ALL|EUR|GBP|USD)/i.test(fullText)) {
    result.isRefund = true;
  }

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

export function splitIntoTransactionChunks(rawText: string): string[] {
  if (!rawText) return [];
  const normalized = String(rawText).replace(/\r\n/g, "\n").trim();

  // 0. If it is an Apple Wallet receipt screen, it is always a single transaction
  if (isAppleWalletReceipt(normalized)) {
    return [normalized];
  }

  // 1. Try splitting by double or more newlines (typical between notifications or stacked list items)
  let chunks = normalized.split(/\n\s*\n+/).map((c) => c.trim()).filter(Boolean);

  // 2. If only 1 chunk, look for repeating bank/app headers or payment verbs on separate lines
  if (chunks.length <= 1) {
    const boundaryRegex = /(?:^|\n)(?=(?:Monzo|Jet Bank|JetBank|Yuh|Revolut|Raiffeisen|BKT|Credins|Intesa|OTP|You paid|You spent|Pages[eë]|Blerje|Transaksion)\b)/gi;
    const splitByHeader = normalized.split(boundaryRegex).map((c) => c.trim()).filter(Boolean);
    if (splitByHeader.length > 1) {
      chunks = splitByHeader;
    }
  }

  // 3. If still 1 chunk, look for multiple lines that each look like a transaction amount
  // Exclude Total / Subtotal lines so receipt summary breakdown is not counted as multiple transactions
  if (chunks.length <= 1) {
    const lines = normalized.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    const currPattern = /(?:[€$£]|ALL|EUR|GBP|USD|LEK)\s*[\d,]+|[\d,]+\s*(?:[€$£]|ALL|EUR|GBP|USD|LEK)/i;
    const nonTotalLines = lines.filter((l) => !/^(?:total|subtotal|balance|balanca|shuma)/i.test(l));
    const currencyLineCount = nonTotalLines.filter((l) => currPattern.test(l)).length;

    if (currencyLineCount > 1) {
      const grouped: string[] = [];
      let currentGroup: string[] = [];
      for (const line of lines) {
        if (currPattern.test(line) && !/^(?:total|subtotal)/i.test(line) && currentGroup.length > 0 && currentGroup.some((g) => currPattern.test(g) && !/^(?:total|subtotal)/i.test(g))) {
          const isDualFollowUp = /^\s*\(\s*(?:[€$£]|ALL|EUR|GBP|USD|LEK)?\s*[\d,]+/i.test(line);
          if (!isDualFollowUp) {
            grouped.push(currentGroup.join("\n"));
            currentGroup = [];
          }
        }
        currentGroup.push(line);
      }
      if (currentGroup.length > 0) {
        grouped.push(currentGroup.join("\n"));
      }
      if (grouped.length > 1) {
        chunks = grouped;
      }
    }
  }

  return chunks;
}

export interface ProcessExpenseItemParams {
  amount?: number | string;
  currency?: Currency | string;
  merchant?: string;
  description?: string;
  cardName?: string;
  cardDigits?: string;
  category?: string;
  date?: string | Date;
  rawInputSnippet?: string;
  isRefund?: boolean;
}

export interface ProcessExpenseResult {
  status: "recorded" | "duplicate" | "ignored" | "invalid";
  message: string;
  expense?: any;
  account?: any;
  numericAmount?: number;
  finalDeductionAmount?: number;
  merchant?: string;
  error?: string;
}

export async function processExpenseItem(
  item: ProcessExpenseItemParams,
  user: any,
  accounts: any[],
  rates: any
): Promise<ProcessExpenseResult> {
  const { amount, currency, merchant, description, cardName, cardDigits, category, date, rawInputSnippet, isRefund } = item;

  if (amount === undefined || amount === null || amount === "") {
    return {
      status: "invalid",
      message: "Amount is required.",
      error: "Amount is required.",
    };
  }

  let cleanAmountStr = String(amount).replace(/,/g, "").trim();
  const matchNum = cleanAmountStr.match(/-?\d+(\.\d+)?/);
  const numericAmount = matchNum ? Math.abs(parseFloat(matchNum[0])) : NaN;

  if (Number.isNaN(numericAmount) || numericAmount <= 0) {
    return {
      status: "invalid",
      message: "Invalid amount value. Must be greater than 0.",
      error: "Invalid amount value. Must be greater than 0.",
    };
  }

  let transactionCurrency = detectCurrency(currency as string, amount) || (currency as Currency);

  const baseDescription = (
    merchant ||
    description ||
    rawInputSnippet ||
    "Card Transaction"
  ).trim();

  const finalCategory =
    category && typeof category === "string" && category.trim() !== "Other"
      ? category.trim()
      : autoDetectCategory(baseDescription);

  let transactionDate = date
    ? (date instanceof Date ? date : parseTransactionDate(date))
    : new Date();

  const rawSettings = (user.applePaySettings as any) || {};
  const unmappedAction: "ignore" | "default" = rawSettings.unmappedAction || "ignore";
  const defaultAccountId: number | null = rawSettings.defaultAccountId || null;
  const cardMappings: ApplePayCardMapping[] = Array.isArray(rawSettings.cardMappings)
    ? rawSettings.cardMappings
    : [];

  let matchedAccount: (typeof accounts)[0] | null = null;
  const effectiveCardName = (cardName || "").trim();
  const parsedDigits = cardDigits;

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

    // 2. Normalized card mapping match
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

    // 4. Partial keyword match
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

    // 5. Transaction currency match
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
    if (defaultAccountId) {
      const def = accounts.find((a) => a.id === defaultAccountId);
      if (def) matchedAccount = def;
    }

    if (!matchedAccount && unmappedAction === "ignore") {
      return {
        status: "ignored",
        message: `Transaction of ${numericAmount.toFixed(2)} at ${baseDescription} was skipped: Card "${effectiveCardName || "Unknown"}" is not linked to any Money Tracker account.`,
        merchant: baseDescription,
        numericAmount,
      };
    }

    if (!matchedAccount) {
      matchedAccount = accounts[0];
    }
  }

  // Intelligent Currency Detection & Multi-Currency Conversion
  if (!transactionCurrency) {
    if (user.totalsMainCurrency && user.totalsMainCurrency !== matchedAccount.baseCurrency) {
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

  // Duplicate Protection (Idempotency) - 30 minutes check
  const recentThreshold = new Date(Date.now() - 30 * 60 * 1000);

  // Handle Refund (Money entering account as a DEPOSIT)
  if (isRefund) {
    const existingRefund = await prisma.accountAction.findFirst({
      where: {
        userId: user.id,
        accountId: matchedAccount.id,
        type: "DEPOSIT",
        amount: {
          gte: finalDeductionAmount - 0.01,
          lte: finalDeductionAmount + 0.01,
        },
        createdAt: { gte: recentThreshold },
      },
    });

    if (existingRefund) {
      const minutesAgo = Math.max(1, Math.round((Date.now() - existingRefund.createdAt.getTime()) / 60000));
      return {
        status: "duplicate",
        message: `Already recorded refund: "${finalDescription}" (${formatMoney(finalDeductionAmount, matchedAccount.baseCurrency as Currency)}) was already logged ${minutesAgo}m ago. Skipped duplicate.`,
        expense: existingRefund,
        account: {
          id: matchedAccount.id,
          name: matchedAccount.name,
          remainingBalance: matchedAccount.balance,
          currency: matchedAccount.baseCurrency,
        },
        merchant: baseDescription,
        numericAmount,
        finalDeductionAmount,
      };
    }

    const refundDesc = finalDescription.toLowerCase().includes("refund")
      ? finalDescription
      : `Refund: ${finalDescription}`;

    const result = await prisma.$transaction(async (tx) => {
      const updatedAccount = await tx.account.update({
        where: { id: matchedAccount.id },
        data: {
          balance: {
            increment: finalDeductionAmount,
          },
        },
      });

      const action = await tx.accountAction.create({
        data: {
          userId: user.id,
          accountId: matchedAccount.id,
          type: "DEPOSIT",
          amount: finalDeductionAmount,
          description: refundDesc,
          date: transactionDate,
        },
      });

      return { action, updatedAccount };
    });

    return {
      status: "recorded",
      message: `Recorded refund of ${formatMoney(finalDeductionAmount, matchedAccount.baseCurrency as Currency)} from ${baseDescription} into ${matchedAccount.name}${currencyNote ? ` converted from ${formatMoney(numericAmount, transactionCurrency!)}` : ""}`,
      expense: result.action,
      account: {
        id: result.updatedAccount.id,
        name: result.updatedAccount.name,
        remainingBalance: result.updatedAccount.balance,
        currency: result.updatedAccount.baseCurrency,
      },
      merchant: baseDescription,
      numericAmount,
      finalDeductionAmount,
    };
  }

  // Handle Standard Expense
  const existingDuplicate = await prisma.expense.findFirst({
    where: {
      userId: user.id,
      accountId: matchedAccount.id,
      amount: {
        gte: finalDeductionAmount - 0.01,
        lte: finalDeductionAmount + 0.01,
      },
      createdAt: { gte: recentThreshold },
      OR: [
        { description: finalDescription },
        { description: { contains: baseDescription } },
        {
          date: {
            gte: new Date(transactionDate.getTime() - 2 * 60 * 1000),
            lte: new Date(transactionDate.getTime() + 2 * 60 * 1000),
          },
        },
      ],
    },
  });

  if (existingDuplicate) {
    const minutesAgo = Math.max(1, Math.round((Date.now() - existingDuplicate.createdAt.getTime()) / 60000));
    return {
      status: "duplicate",
      message: `Already recorded: "${finalDescription}" (${formatMoney(finalDeductionAmount, matchedAccount.baseCurrency as Currency)}) was already logged ${minutesAgo}m ago. Skipped duplicate.`,
      expense: existingDuplicate,
      account: {
        id: matchedAccount.id,
        name: matchedAccount.name,
        remainingBalance: matchedAccount.balance,
        currency: matchedAccount.baseCurrency,
      },
      merchant: baseDescription,
      numericAmount,
      finalDeductionAmount,
    };
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

  return {
    status: "recorded",
    message: `Recorded ${formatMoney(finalDeductionAmount, matchedAccount.baseCurrency as Currency)} at ${baseDescription} under ${finalCategory} (${matchedAccount.name})${currencyNote ? ` converted from ${formatMoney(numericAmount, transactionCurrency!)}` : ""}`,
    expense: result.expense,
    account: {
      id: result.updatedAccount.id,
      name: result.updatedAccount.name,
      remainingBalance: result.updatedAccount.balance,
      currency: result.updatedAccount.baseCurrency,
    },
    merchant: baseDescription,
    numericAmount,
    finalDeductionAmount,
  };
}

// In-memory request deduplication cache to handle rapid Back Tap double-triggers
interface CachedWebhookResponse {
  timestamp: number;
  statusCode: number;
  body: any;
}
const recentWebhookRequests = new Map<string, CachedWebhookResponse>();

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

    const rates = await fetchExchangeRates().catch(() => ({}));

    // In-memory deduplication check (clean entries older than 60s)
    const now = Date.now();
    for (const [key, entry] of recentWebhookRequests.entries()) {
      if (now - entry.timestamp > 60000) {
        recentWebhookRequests.delete(key);
      }
    }

    const rawInputText = req.body.text ?? req.body.rawText ?? req.body.notification ?? req.body.message;
    let normalizedInputText = "";
    if (Array.isArray(rawInputText)) {
      normalizedInputText = rawInputText.map((t) => String(t || "").trim()).filter(Boolean).join("\n");
    } else if (rawInputText && typeof rawInputText === "object") {
      normalizedInputText = Object.values(rawInputText).map((t) => String(t || "").trim()).filter(Boolean).join("\n");
    } else if (typeof rawInputText === "string") {
      normalizedInputText = rawInputText.trim();
    }

    const requestFingerprint = `${user.id}:${crypto.createHash("md5").update(normalizedInputText || JSON.stringify(req.body)).digest("hex")}`;
    const cachedResp = recentWebhookRequests.get(requestFingerprint);
    if (cachedResp && now - cachedResp.timestamp < 15000) {
      return res.status(cachedResp.statusCode).json(cachedResp.body);
    }

    const sendResponse = (statusCode: number, responseBody: any) => {
      recentWebhookRequests.set(requestFingerprint, {
        timestamp: Date.now(),
        statusCode,
        body: responseBody,
      });
      return res.status(statusCode).json(responseBody);
    };

    // If explicit amount is provided (e.g. from simulator or structured webhook)
    if (req.body.amount !== undefined && req.body.amount !== null && req.body.amount !== "") {
      const result = await processExpenseItem(req.body, user, accounts, rates);
      if (result.status === "invalid") {
        return sendResponse(400, { error: result.error || result.message });
      }
      if (result.status === "ignored" || result.status === "duplicate") {
        return sendResponse(200, {
          success: true,
          [result.status]: true,
          message: result.message,
          expense: result.expense,
          account: result.account,
        });
      }
      return sendResponse(201, {
        success: true,
        message: result.message,
        expense: result.expense,
        account: result.account,
      });
    }

    // Otherwise, parse from text
    if (!normalizedInputText) {
      return sendResponse(400, {
        error: "Amount is required. Could not automatically extract an amount. Server received: (EMPTY/NO TEXT SENT)",
      });
    }

    // Check if the text contains multiple transactions
    const chunks = splitIntoTransactionChunks(normalizedInputText);
    const candidateItems: ProcessExpenseItemParams[] = chunks.map((chunk) => {
      const parsed = parseTransactionFromText(chunk);
      return {
        ...parsed,
        rawInputSnippet: chunk.slice(0, 45).trim(),
        category: req.body.category,
        date: req.body.date || parsed.date,
        isRefund: req.body.isRefund ?? parsed.isRefund,
      };
    });

    const validItems = candidateItems.filter(
      (c) => c.amount !== undefined && !Number.isNaN(Number(c.amount)) && Number(c.amount) > 0
    );

    // If multiple distinct transactions were identified in the text
    if (validItems.length > 1) {
      const recorded: any[] = [];
      const duplicates: any[] = [];
      const ignored: any[] = [];

      for (const item of validItems) {
        const itemResult = await processExpenseItem(item, user, accounts, rates);
        if (itemResult.status === "recorded") {
          recorded.push(itemResult);
        } else if (itemResult.status === "duplicate") {
          duplicates.push(itemResult);
        } else if (itemResult.status === "ignored") {
          ignored.push(itemResult);
        }
      }

      const totalCount = validItems.length;
      const recCount = recorded.length;
      const dupCount = duplicates.length;

      let summaryMessage = `Processed ${totalCount} transactions: ${recCount} recorded`;
      if (dupCount > 0) {
        summaryMessage += `, ${dupCount} already recorded in last 30m`;
      }
      if (ignored.length > 0) {
        summaryMessage += `, ${ignored.length} unmapped cards skipped`;
      }
      summaryMessage += ".";

      return sendResponse(recCount > 0 ? 201 : 200, {
        success: true,
        multi: true,
        message: summaryMessage,
        recordedCount: recCount,
        duplicateCount: dupCount,
        ignoredCount: ignored.length,
        recorded,
        duplicates,
        ignored,
      });
    }

    // Single transaction fallback (or when only 1 valid item found)
    const singleParsed = validItems[0] || parseTransactionFromText(normalizedInputText);
    const singleItem: ProcessExpenseItemParams = {
      ...singleParsed,
      rawInputSnippet: normalizedInputText.slice(0, 45).trim(),
      category: req.body.category,
      date: req.body.date || singleParsed.date,
      isRefund: req.body.isRefund ?? singleParsed.isRefund,
    };

    const singleResult = await processExpenseItem(singleItem, user, accounts, rates);

    if (singleResult.status === "invalid") {
      const debugText = normalizedInputText ? `"${normalizedInputText.slice(0, 100)}"` : "(EMPTY/NO TEXT SENT)";
      return sendResponse(400, {
        error: `Amount is required. Could not automatically extract an amount. Server received: ${debugText}`,
      });
    }

    if (singleResult.status === "ignored" || singleResult.status === "duplicate") {
      return sendResponse(200, {
        success: true,
        [singleResult.status]: true,
        message: singleResult.message,
        expense: singleResult.expense,
        account: singleResult.account,
      });
    }

    return sendResponse(201, {
      success: true,
      message: singleResult.message,
      expense: singleResult.expense,
      account: singleResult.account,
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

