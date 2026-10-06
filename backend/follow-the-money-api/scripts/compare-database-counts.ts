import mysql from "mysql2/promise";
import { PrismaClient } from "@prisma/client";

/**
 * Compares record counts and financial totals between MySQL (Railway)
 * and PostgreSQL (Supabase / Local) to verify data integrity.
 *
 * Requirements:
 * - Never log passwords or full connection URLs.
 * - Do not use JavaScript Number for financial totals (uses exact decimal string math).
 * - Exits with code 0 if identical, code 1 if discrepancies exist.
 *
 * Usage:
 *   RAILWAY_MYSQL_URL="mysql://..." DATABASE_URL="postgresql://..." npx ts-node scripts/compare-database-counts.ts
 */

const prisma = new PrismaClient();

// Helper to mask sensitive connection strings in logs
function maskUrl(url?: string): string {
  if (!url) return "<not provided>";
  return url.replace(/:([^:@]+)@/, ":****@");
}

// Decimal-safe string summation in cents to avoid IEEE 754 floating point distortion
function addDecimalString(totalCents: bigint, value: number | string | null | undefined): bigint {
  if (value === null || value === undefined || value === "") return totalCents;
  const numStr = typeof value === "number" ? value.toFixed(2) : String(value);
  const [whole, fraction = ""] = numStr.split(".");
  const paddedFraction = fraction.padEnd(2, "0").slice(0, 2);
  const cents = BigInt(whole) * 100n + BigInt(paddedFraction);
  return totalCents + cents;
}

function formatCentsToDecimal(totalCents: bigint): string {
  const isNegative = totalCents < 0n;
  const absCents = isNegative ? -totalCents : totalCents;
  const whole = absCents / 100n;
  const frac = (absCents % 100n).toString().padStart(2, "0");
  return `${isNegative ? "-" : ""}${whole}.${frac}`;
}

async function main() {
  const mysqlUrl = process.env.RAILWAY_MYSQL_URL || process.env.MYSQL_URL;
  const postgresUrl = process.env.DATABASE_URL || process.env.SUPABASE_DIRECT_URL;

  console.log("==========================================================");
  console.log("      DATABASE VERIFICATION & COUNT COMPARISON AUDIT      ");
  console.log("==========================================================");
  console.log(`Source MySQL:       ${maskUrl(mysqlUrl)}`);
  console.log(`Target PostgreSQL:  ${maskUrl(postgresUrl)}\n`);

  if (!mysqlUrl) {
    console.error("❌ ERROR: Source MySQL URL not provided in RAILWAY_MYSQL_URL.");
    console.error("   Example: RAILWAY_MYSQL_URL='mysql://user:pass@host:3306/db' npx ts-node scripts/compare-database-counts.ts");
    process.exit(1);
  }

  if (!postgresUrl) {
    console.error("❌ ERROR: Target PostgreSQL URL not provided in DATABASE_URL.");
    process.exit(1);
  }

  let mysqlConnection: mysql.Connection | null = null;
  let hasDiscrepancy = false;

  try {
    console.log("Connecting to databases...");
    mysqlConnection = await mysql.createConnection(mysqlUrl);
    await prisma.$connect();
    console.log("✔ Connected to both source and target databases.\n");

    const tables = [
      "User",
      "Account",
      "Expense",
      "Subscription",
      "Note",
      "AccountAction",
      "EmailVerificationCode",
      "PendingEmailChange",
    ];

    console.log("----------------------------------------------------------");
    console.log(
      `${"Table Name".padEnd(25)} | ${"MySQL Rows".padStart(12)} | ${"Postgres Rows".padStart(13)} | Status`
    );
    console.log("----------------------------------------------------------");

    for (const table of tables) {
      // MySQL count
      const [mysqlRows]: any = await mysqlConnection.query(
        `SELECT COUNT(*) as count FROM \`${table}\``
      );
      const mysqlCount = Number(mysqlRows[0]?.count ?? 0);

      // Postgres count
      let pgCount = 0;
      switch (table) {
        case "User":
          pgCount = await prisma.user.count();
          break;
        case "Account":
          pgCount = await prisma.account.count();
          break;
        case "Expense":
          pgCount = await prisma.expense.count();
          break;
        case "Subscription":
          pgCount = await prisma.subscription.count();
          break;
        case "Note":
          pgCount = await prisma.note.count();
          break;
        case "AccountAction":
          pgCount = await prisma.accountAction.count();
          break;
        case "EmailVerificationCode":
          pgCount = await prisma.emailVerificationCode.count();
          break;
        case "PendingEmailChange":
          pgCount = await prisma.pendingEmailChange.count();
          break;
      }

      const match = mysqlCount === pgCount;
      if (!match) hasDiscrepancy = true;

      const status = match ? "✔ MATCH" : "❌ MISMATCH";
      console.log(
        `${table.padEnd(25)} | ${String(mysqlCount).padStart(12)} | ${String(pgCount).padStart(13)} | ${status}`
      );
    }

    console.log("----------------------------------------------------------\n");

    // Financial Totals Comparison (Decimal-Safe)
    console.log("----------------------------------------------------------");
    console.log("               FINANCIAL TOTALS COMPARISON                ");
    console.log("----------------------------------------------------------");
    console.log(
      `${"Metric".padEnd(25)} | ${"MySQL Sum".padStart(15)} | ${"Postgres Sum".padStart(15)} | Status`
    );
    console.log("----------------------------------------------------------");

    // 1. Account balances
    const [mysqlAccountRows]: any = await mysqlConnection.query(
      "SELECT balance FROM `Account`"
    );
    let mysqlAccountCents = 0n;
    for (const row of mysqlAccountRows) {
      mysqlAccountCents = addDecimalString(mysqlAccountCents, row.balance);
    }

    const pgAccounts = await prisma.account.findMany({ select: { balance: true } });
    let pgAccountCents = 0n;
    for (const row of pgAccounts) {
      pgAccountCents = addDecimalString(pgAccountCents, row.balance);
    }

    const accountMatch = mysqlAccountCents === pgAccountCents;
    if (!accountMatch) hasDiscrepancy = true;
    console.log(
      `${"Account Balances".padEnd(25)} | ${formatCentsToDecimal(mysqlAccountCents).padStart(15)} | ${formatCentsToDecimal(pgAccountCents).padStart(15)} | ${accountMatch ? "✔ MATCH" : "❌ MISMATCH"}`
    );

    // 2. Expense amounts
    const [mysqlExpenseRows]: any = await mysqlConnection.query(
      "SELECT amount FROM `Expense`"
    );
    let mysqlExpenseCents = 0n;
    for (const row of mysqlExpenseRows) {
      mysqlExpenseCents = addDecimalString(mysqlExpenseCents, row.amount);
    }

    const pgExpenses = await prisma.expense.findMany({ select: { amount: true } });
    let pgExpenseCents = 0n;
    for (const row of pgExpenses) {
      pgExpenseCents = addDecimalString(pgExpenseCents, row.amount);
    }

    const expenseMatch = mysqlExpenseCents === pgExpenseCents;
    if (!expenseMatch) hasDiscrepancy = true;
    console.log(
      `${"Expense Amounts".padEnd(25)} | ${formatCentsToDecimal(mysqlExpenseCents).padStart(15)} | ${formatCentsToDecimal(pgExpenseCents).padStart(15)} | ${expenseMatch ? "✔ MATCH" : "❌ MISMATCH"}`
    );

    // 3. Subscription prices
    const [mysqlSubRows]: any = await mysqlConnection.query(
      "SELECT price FROM `Subscription`"
    );
    let mysqlSubCents = 0n;
    for (const row of mysqlSubRows) {
      mysqlSubCents = addDecimalString(mysqlSubCents, row.price);
    }

    const pgSubscriptions = await prisma.subscription.findMany({ select: { price: true } });
    let pgSubCents = 0n;
    for (const row of pgSubscriptions) {
      pgSubCents = addDecimalString(pgSubCents, row.price);
    }

    const subMatch = mysqlSubCents === pgSubCents;
    if (!subMatch) hasDiscrepancy = true;
    console.log(
      `${"Subscription Prices".padEnd(25)} | ${formatCentsToDecimal(mysqlSubCents).padStart(15)} | ${formatCentsToDecimal(pgSubCents).padStart(15)} | ${subMatch ? "✔ MATCH" : "❌ MISMATCH"}`
    );

    // 4. AccountAction amounts
    const [mysqlActionRows]: any = await mysqlConnection.query(
      "SELECT amount FROM `AccountAction`"
    );
    let mysqlActionCents = 0n;
    for (const row of mysqlActionRows) {
      mysqlActionCents = addDecimalString(mysqlActionCents, row.amount);
    }

    const pgActions = await prisma.accountAction.findMany({ select: { amount: true } });
    let pgActionCents = 0n;
    for (const row of pgActions) {
      pgActionCents = addDecimalString(pgActionCents, row.amount);
    }

    const actionMatch = mysqlActionCents === pgActionCents;
    if (!actionMatch) hasDiscrepancy = true;
    console.log(
      `${"AccountAction Amounts".padEnd(25)} | ${formatCentsToDecimal(mysqlActionCents).padStart(15)} | ${formatCentsToDecimal(pgActionCents).padStart(15)} | ${actionMatch ? "✔ MATCH" : "❌ MISMATCH"}`
    );

    console.log("----------------------------------------------------------\n");

    if (hasDiscrepancy) {
      console.error("❌ CRITICAL: Discrepancies detected between MySQL and PostgreSQL databases!");
      console.error("   Review the output above before proceeding or cutting over.");
      process.exit(1);
    } else {
      console.log("🎉 ALL ROW COUNTS AND FINANCIAL TOTALS MATCH PERFECTLY!");
      console.log("   The PostgreSQL database is 100% verified against MySQL.");
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Error running database count comparison:", error);
    process.exit(1);
  } finally {
    if (mysqlConnection) await mysqlConnection.end();
    await prisma.$disconnect();
  }
}

main();
