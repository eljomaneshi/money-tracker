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