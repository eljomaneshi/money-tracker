export type Currency = "ALL" | "EUR" | "GBP" | "USD";

export interface ExchangeRates {
    EUR: number;
    ALL: number;
    GBP: number;
    USD: number;
}

let cachedRates: { rates: ExchangeRates; fetchedAt: number } | null = null;
const RATES_CACHE_TTL = 1000 * 60 * 60; // 1 hour in ms

export async function fetchExchangeRates(): Promise<ExchangeRates> {
    const now = Date.now();
    if (cachedRates && now - cachedRates.fetchedAt < RATES_CACHE_TTL) {
        return cachedRates.rates;
    }

    try {
        const response = await fetch("https://open.er-api.com/v6/latest/EUR", {
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch exchange rates");
        }

        const data = await response.json();

        const allRate = Number(data?.rates?.ALL);
        const gbpRate = Number(data?.rates?.GBP);
        const usdRate = Number(data?.rates?.USD);

        if (
            !Number.isFinite(allRate) || allRate <= 0 ||
            !Number.isFinite(gbpRate) || gbpRate <= 0 ||
            !Number.isFinite(usdRate) || usdRate <= 0
        ) {
            throw new Error("Invalid exchange rates received");
        }

        const rates: ExchangeRates = {
            EUR: 1,
            ALL: allRate,
            GBP: gbpRate,
            USD: usdRate,
        };

        cachedRates = { rates, fetchedAt: now };
        return rates;
    } catch (err) {
        console.error("Exchange rates fetch error:", err);
        if (cachedRates) {
            return cachedRates.rates;
        }
        return {
            EUR: 1,
            ALL: 100,
            GBP: 0.86,
            USD: 1.08,
        };
    }
}

export function convertAmount(
    amount: number,
    from: Currency,
    to: Currency,
    rates: ExchangeRates
): number {
    if (from === to) return amount;

    const fromRate = from === "EUR" ? 1 : rates[from];
    const toRate = to === "EUR" ? 1 : rates[to];

    if (
        !Number.isFinite(amount) ||
        !Number.isFinite(fromRate) ||
        !Number.isFinite(toRate) ||
        fromRate <= 0 ||
        toRate <= 0
    ) {
        return amount;
    }

    const amountInEur = from === "EUR" ? amount : amount / fromRate;
    const converted = to === "EUR" ? amountInEur : amountInEur * toRate;
    return Math.round(converted * 100) / 100;
}

export function detectCurrency(
    currencyInput?: any,
    amountInput?: any
): Currency | null {
    if (typeof currencyInput === "string" && currencyInput.trim()) {
        const c = currencyInput.trim().toUpperCase();
        if (c === "ALL" || c === "LEK" || c === "LEKE") return "ALL";
        if (c === "EUR" || c === "€") return "EUR";
        if (c === "GBP" || c === "£") return "GBP";
        if (c === "USD" || c === "$") return "USD";
    }

    if (typeof amountInput === "string") {
        const upper = amountInput.toUpperCase();
        if (upper.includes("ALL") || upper.includes("LEK")) return "ALL";
        if (upper.includes("EUR") || upper.includes("€")) return "EUR";
        if (upper.includes("GBP") || upper.includes("£")) return "GBP";
        if (upper.includes("USD") || upper.includes("$")) return "USD";
    }

    return null;
}

export const formatNumber = (value: number) =>
    new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);

const getCurrencyLabel = (currency: Currency) => {
    if (currency === "ALL") return "ALL";
    if (currency === "EUR") return "€";
    if (currency === "GBP") return "£";
    return "$";
};

export const formatMoney = (
    amount: number,
    currency: Currency,
    position: "before" | "after" = "before"
) => {
    const formatted = formatNumber(amount);
    const label = getCurrencyLabel(currency);

    return position === "before"
        ? `${label} ${formatted}`
        : `${formatted} ${label}`;
};