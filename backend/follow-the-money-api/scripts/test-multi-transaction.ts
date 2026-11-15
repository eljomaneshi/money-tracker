import { splitIntoTransactionChunks, parseTransactionFromText } from '../src/controllers/integration.controller';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

console.log("Testing multi-transaction parsing...");

// Case 1: Stacked Monzo notifications on iOS lock screen
const monzoStacked = `
Monzo
Rossman & Lala
ALL 2,872 · 1h ago

Monzo
Bar Hemingway
ALL 500 · 30m ago
`;

const chunks1 = splitIntoTransactionChunks(monzoStacked);
console.log("Chunks 1:", chunks1.length);
assert(chunks1.length === 2, "Expected 2 chunks for stacked Monzo notifications");

const t1 = parseTransactionFromText(chunks1[0]);
assert(t1.amount === 2872, `Expected 2872, got ${t1.amount}`);
assert(t1.currency === "ALL", `Expected ALL, got ${t1.currency}`);
assert(t1.merchant === "Rossman & Lala", `Expected Rossman & Lala, got ${t1.merchant}`);

const t2 = parseTransactionFromText(chunks1[1]);
assert(t2.amount === 500, `Expected 500, got ${t2.amount}`);
assert(t2.currency === "ALL", `Expected ALL, got ${t2.currency}`);
assert(t2.merchant === "Bar Hemingway", `Expected Bar Hemingway, got ${t2.merchant}`);

// Case 2: Albanian bank notifications
const bankStacked = `
Jet Bank: Ju keni kryer pagesë 1500 ALL tek Spar me kartën *9897.
Jet Bank: Ju keni kryer pagesë 25 EUR tek Zara me kartën *7076.
`;

const chunks2 = splitIntoTransactionChunks(bankStacked);
console.log("Chunks 2:", chunks2.length);
assert(chunks2.length === 2, "Expected 2 chunks for Albanian bank stacked notifications");

const t3 = parseTransactionFromText(chunks2[0]);
assert(t3.amount === 1500, `Expected 1500, got ${t3.amount}`);
assert(t3.currency === "ALL", `Expected ALL, got ${t3.currency}`);
assert(t3.cardDigits === "9897", `Expected 9897, got ${t3.cardDigits}`);
assert(t3.merchant === "Spar", `Expected Spar, got ${t3.merchant}`);

const t4 = parseTransactionFromText(chunks2[1]);
assert(t4.amount === 25, `Expected 25, got ${t4.amount}`);
assert(t4.currency === "EUR", `Expected EUR, got ${t4.currency}`);
assert(t4.cardDigits === "7076", `Expected 7076, got ${t4.cardDigits}`);
assert(t4.merchant === "Zara", `Expected Zara, got ${t4.merchant}`);

// Case 3: Dual currency single transaction (should NOT split)
const dual = "£26.94 (ALL 2,872) at Rossman & Lala";
const chunks3 = splitIntoTransactionChunks(dual);
assert(chunks3.length === 1, "Dual currency should stay 1 chunk");
const t5 = parseTransactionFromText(chunks3[0]);
assert(t5.amount === 26.94, "Expected 26.94");
assert(t5.currency === "GBP", "Expected GBP");

// Case 4: Lock screen notification screenshot with VodafoneAL carrier & lockscreen widgets
const lockscreenRefund = `
VodafoneAL • | = 36 Sat 17 Oct 17:08 17° Mostl
Notification Centre
Monzo
1h ago
💳 £42.30 refund from Easybet
`;

const chunks4 = splitIntoTransactionChunks(lockscreenRefund);
console.log("Chunks 4:", chunks4.length);
assert(chunks4.length === 1, "Expected 1 clean chunk for lockscreen notification");
const t6 = parseTransactionFromText(chunks4[0]);
assert(t6.amount === 42.30, `Expected 42.30, got ${t6.amount}`);
assert(t6.currency === "GBP", `Expected GBP, got ${t6.currency}`);
assert(t6.merchant === "Easybet", `Expected Easybet, got ${t6.merchant}`);
assert(t6.isRefund === true, `Expected isRefund true, got ${t6.isRefund}`);
assert(t6.cardName === "Monzo Mastercard", `Expected Monzo Mastercard, got ${t6.cardName}`);

// Verify description format for refund
const baseDesc4 = (t6.merchant || "Card Transaction").trim();
const refundDesc4 = t6.isRefund ? (baseDesc4.toLowerCase().includes("refund") ? baseDesc4 : `Refund: ${baseDesc4}`) : baseDesc4;
assert(refundDesc4 === "Refund: Easybet", `Expected "Refund: Easybet", got "${refundDesc4}"`);

// Case 5: Pure refund line
const pureRefund = "£42.30 refund from Easybet";
const t7 = parseTransactionFromText(pureRefund);
assert(t7.amount === 42.30, `Expected 42.30, got ${t7.amount}`);
assert(t7.currency === "GBP", `Expected GBP, got ${t7.currency}`);
assert(t7.merchant === "Easybet", `Expected Easybet, got ${t7.merchant}`);
assert(t7.isRefund === true, `Expected isRefund true, got ${t7.isRefund}`);

// Case 6: Albanian bank refund with VodafoneAL header
const albanianRefund = `
VodafoneAL
Jet Bank: Rimbursim prej 4500 ALL nga Easybet
`;
const chunks6 = splitIntoTransactionChunks(albanianRefund);
assert(chunks6.length === 1, "Expected 1 chunk for Albanian refund");
const t8 = parseTransactionFromText(chunks6[0]);
assert(t8.amount === 4500, `Expected 4500, got ${t8.amount}`);
assert(t8.currency === "ALL", `Expected ALL, got ${t8.currency}`);
assert(t8.merchant === "Easybet", `Expected Easybet, got ${t8.merchant}`);
assert(t8.isRefund === true, `Expected isRefund true, got ${t8.isRefund}`);

// Case 7: Stacked lock screen notifications starting with VodafoneAL
const stackedWithVodafone = `
VodafoneAL • | = 36 Sat 17 Oct 17:08 17° Mostl
Notification Centre
Monzo
1h ago
💳 £42.30 refund from Easybet

Monzo
2h ago
You spent £15.20 at Sainsbury's
`;
const chunks7 = splitIntoTransactionChunks(stackedWithVodafone);
console.log("Chunks 7:", chunks7.length);
assert(chunks7.length === 2, "Expected 2 chunks for stacked lockscreen notifications");
const t9 = parseTransactionFromText(chunks7[0]);
assert(t9.merchant === "Easybet", `Expected Easybet, got ${t9.merchant}`);
assert(t9.isRefund === true, `Expected isRefund true, got ${t9.isRefund}`);
const t10 = parseTransactionFromText(chunks7[1]);
assert(t10.merchant === "Sainsbury's", `Expected Sainsbury's, got ${t10.merchant}`);
assert(t10.amount === 15.20, `Expected 15.20, got ${t10.amount}`);

console.log("All multi-transaction and lockscreen parsing tests passed successfully! 🎉");
