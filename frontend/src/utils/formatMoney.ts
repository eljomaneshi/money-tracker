export type Currency = "ALL" | "EUR" | "GBP" | "USD";

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

export type ExchangeRates = {
  ALL: number;
  EUR: number;
  GBP: number;
  USD: number;
};

export const convertAmount = (
  amount: number,
  from: Currency,
  to: Currency,
  rates: ExchangeRates
) => {
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
    return 0;
  }

  const amountInEur = from === "EUR" ? amount : amount / fromRate;
  return to === "EUR" ? amountInEur : amountInEur * toRate;
};