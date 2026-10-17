import {
  isAppleWalletReceipt,
  parseAppleWalletReceipt,
  splitIntoTransactionChunks,
  parseTransactionFromText,
} from '../src/controllers/integration.controller';

const testCases = [
  {
    name: "User Screenshot 1: WhatsApp Image (Rossman & Lala)",
    text: `14:21
<
ALL 2,872
Rossman & Lala
16/10/2026, 20:23
Status: Approved
Monzo Mastercard
Total ALL 2,872
View in Monzo App
Contact Monzo
Report Incorrect Merchant Info`,
    expectedAmount: 2872,
    expectedCurrency: "ALL",
    expectedMerchant: "Rossman & Lala",
    expectedCard: "Monzo Mastercard",
    expectedRefund: undefined,
  },
  {
    name: "User Screenshot 2: 198c4f3f (Ins Brunch Delijorgji)",
    text: `14:24
<
ALL 3,100
Ins Brunch Delijorgji
14/10/2026, 20:05
Status: Approved
Monzo Mastercard
Total ALL 3,100
View in Monzo App
Contact Monzo`,
    expectedAmount: 3100,
    expectedCurrency: "ALL",
    expectedMerchant: "Ins Brunch Delijorgji",
    expectedCard: "Monzo Mastercard",
  },
  {
    name: "User Screenshot 3: 4fed3693 (Borsanuova)",
    text: `14:24
<
€59.90
Borsanuova
07/10/2026, 15:02
Status: Approved
Monzo Mastercard
Total €59.90
www.vivapayments.com
View in Monzo App
Contact Monzo`,
    expectedAmount: 59.90,
    expectedCurrency: "EUR",
    expectedMerchant: "Borsanuova",
    expectedCard: "Monzo Mastercard",
  },
  {
    name: "User Screenshot 4: 2a09c631 (cineplexx.al)",
    text: `14:25
<
ALL 800
cineplexx.al
17/09/2026, 14:50
Status: Approved
Mastercard Debit
Total ALL 800
ecommerce.raiffeisen.al
Contact Jet Bank`,
    expectedAmount: 800,
    expectedCurrency: "ALL",
    expectedMerchant: "cineplexx.al",
    expectedCard: "Jet Bank ALL",
  },
  {
    name: "User Screenshot 5: 2ed4b3de (Xhangolli Group Shpk)",
    text: `14:25
<
ALL 240
Xhangolli Group Shpk
09/08/2026, 19:49
Status: Approved
Mastercard Debit
Total ALL 240
Contact Jet Bank`,
    expectedAmount: 240,
    expectedCurrency: "ALL",
    expectedMerchant: "Xhangolli Group Shpk",
    expectedCard: "Jet Bank ALL",
  },
  {
    name: "User Screenshot 6: 808f4b85 (Dimitra Bourdara)",
    text: `14:25
<
€10.00
Dimitra Bourdara
24/07/2026, 22:08
Status: Approved
Mastercard Debit
Total €10.00
Contact Jet Bank`,
    expectedAmount: 10.00,
    expectedCurrency: "EUR",
    expectedMerchant: "Dimitra Bourdara",
    expectedCard: "Jet Bank Eur",
  },
  {
    name: "User Screenshot 7: 604f3077 (Hondos Center)",
    text: `14:25
<
€34.31
Hondos Center
22/07/2026, 20:16
Status: Approved
Mastercard Debit
Total €34.31
Hondos Center
Contact Jet Bank`,
    expectedAmount: 34.31,
    expectedCurrency: "EUR",
    expectedMerchant: "Hondos Center",
    expectedCard: "Jet Bank Eur",
  },
  {
    name: "User Screenshot 8: edc07437 (Temu)",
    text: `14:25
<
ALL 1,433
Temu
05/09/2026, 01:09
Status: Approved
Yuh Debit Card
Total ALL 1,433
Contact Yuh`,
    expectedAmount: 1433,
    expectedCurrency: "ALL",
    expectedMerchant: "Temu",
    expectedCard: "Yuh Debit Card",
  },
  {
    name: "Refund Test 1: Status: Refunded",
    text: `14:21
<
ALL 2,872
Rossman & Lala
16/10/2026, 20:23
Status: Refunded
Monzo Mastercard
Total ALL 2,872
Contact Monzo`,
    expectedAmount: 2872,
    expectedCurrency: "ALL",
    expectedMerchant: "Rossman & Lala",
    expectedCard: "Monzo Mastercard",
    expectedRefund: true,
  },
  {
    name: "Refund Test 2: Plus sign on amount (+€25.00)",
    text: `14:21
<
+€25.00
Zara
16/10/2026, 20:23
Status: Approved
Monzo Mastercard
Total +€25.00
Contact Monzo`,
    expectedAmount: 25.00,
    expectedCurrency: "EUR",
    expectedMerchant: "Zara",
    expectedCard: "Monzo Mastercard",
    expectedRefund: true,
  },
];

console.log("=== VERIFYING INTEGRATION CONTROLLER WITH REAL TEST CASES ===");

let allPassed = true;
for (const tc of testCases) {
  // Test 1: isAppleWalletReceipt
  const isWallet = isAppleWalletReceipt(tc.text);
  if (!isWallet) {
    console.error(`FAILED: isAppleWalletReceipt returned false for ${tc.name}`);
    allPassed = false;
  }

  // Test 2: splitIntoTransactionChunks should NEVER split an Apple Wallet receipt into multiple chunks
  const chunks = splitIntoTransactionChunks(tc.text);
  if (chunks.length !== 1) {
    console.error(`FAILED: splitIntoTransactionChunks returned ${chunks.length} chunks (expected 1) for ${tc.name}`);
    allPassed = false;
  }

  // Test 3: parseTransactionFromText
  const parsed = parseTransactionFromText(tc.text);
  console.log(`\nTesting: ${tc.name}`);
  console.log("Parsed:", parsed);

  if (parsed.amount !== tc.expectedAmount) {
    console.error(`FAILED Amount: expected ${tc.expectedAmount}, got ${parsed.amount}`);
    allPassed = false;
  }
  if (parsed.currency !== tc.expectedCurrency) {
    console.error(`FAILED Currency: expected ${tc.expectedCurrency}, got ${parsed.currency}`);
    allPassed = false;
  }
  if (parsed.merchant !== tc.expectedMerchant) {
    console.error(`FAILED Merchant: expected "${tc.expectedMerchant}", got "${parsed.merchant}"`);
    allPassed = false;
  }
  if (parsed.cardName !== tc.expectedCard) {
    console.error(`FAILED Card: expected "${tc.expectedCard}", got "${parsed.cardName}"`);
    allPassed = false;
  }
  if (tc.expectedRefund !== undefined && parsed.isRefund !== tc.expectedRefund) {
    console.error(`FAILED Refund: expected ${tc.expectedRefund}, got ${parsed.isRefund}`);
    allPassed = false;
  }
  if (!parsed.date || Number.isNaN(parsed.date.getTime())) {
    console.error(`FAILED Date: missing or invalid date`);
    allPassed = false;
  } else {
    console.log(`Date parsed correctly: ${parsed.date.toISOString()} (${parsed.date.toLocaleString()})`);
  }
}

if (allPassed) {
  console.log("\n>>> ALL 10 TESTS IN CONTROLLER PASSED WITH 100% SUCCESS! 🚀 <<<");
} else {
  console.error("\n>>> SOME TESTS FAILED <<<");
  process.exit(1);
}
