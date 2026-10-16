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

console.log("All multi-transaction parsing tests passed successfully! 🎉");
