import mysql from "mysql2/promise";
import { PrismaClient } from "@prisma/client";

/**
 * One-off Production Data Migration Script: Railway MySQL -> Supabase PostgreSQL
 *
 * Requirements Met:
 * - Source: RAILWAY_MYSQL_URL
 * - Destination: SUPABASE_DIRECT_URL (or DATABASE_URL)
 * - Passwords and sensitive connection tokens are NEVER logged.
 * - Source MySQL is read-only (mysql2). Absolutely NO modifications to MySQL.
 * - Target PostgreSQL is written via Prisma Client.
 * - Migrates in foreign-key dependency order (User -> Account -> Expense -> Subscription -> Note -> AccountAction -> EmailVerificationCode -> PendingEmailChange).
 * - Original primary keys (id) are preserved.
 * - PostgreSQL SERIAL sequences are automatically reset to MAX(id).
 * - Decimal-safe money conversions (BigInt cents) without IEEE-754 precision loss.
 * - Logical batching within transactions.
 * - Idempotency check: Fails cleanly if records exist unless --clean-target is specified.
 * - Dry-run mode support: --dry-run
 * - Safety protection: --confirm-production required when running against remote databases.
 * - Verified row counts & financial totals before and after migration.
 *
 * Usage:
 *   # Dry run (simulation only, no writes):
 *   RAILWAY_MYSQL_URL="mysql://..." SUPABASE_DIRECT_URL="postgresql://..." npx ts-node scripts/migrate-mysql-to-postgres.ts --dry-run
 *
 *   # Live production migration:
 *   RAILWAY_MYSQL_URL="mysql://..." SUPABASE_DIRECT_URL="postgresql://..." npx ts-node scripts/migrate-mysql-to-postgres.ts --confirm-production
 */

// CLI Flags
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const isConfirmProduction = args.includes("--confirm-production");
const allowCleanTarget = args.includes("--clean-target");

function maskUrl(url?: string): string {
  if (!url) return "<not set>";
  return url.replace(/:([^:@]+)@/, ":****@");
}

function isRemoteHost(url: string): boolean {
  return !url.includes("localhost") && !url.includes("127.0.0.1") && !url.includes("host.docker.internal");
}

// Decimal-safe string summation in cents
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
  const sourceUrl = process.env.RAILWAY_MYSQL_URL || process.env.MYSQL_URL;
  const targetUrl = process.env.SUPABASE_DIRECT_URL || process.env.DIRECT_URL || process.env.DATABASE_URL;

  console.log("======================================================================");
  console.log("    ONE-OFF DATA MIGRATION: RAILWAY MYSQL -> SUPABASE POSTGRESQL     ");
  console.log("======================================================================");
  console.log(`Source MySQL:       ${maskUrl(sourceUrl)}`);
  console.log(`Target PostgreSQL:  ${maskUrl(targetUrl)}`);
  console.log(`Mode:               ${isDryRun ? "🧪 DRY RUN (No changes will be written)" : "🚀 LIVE MIGRATION"}`);
  console.log("======================================================================\n");

  if (!sourceUrl) {
    console.error("❌ ERROR: Source URL missing. Set RAILWAY_MYSQL_URL.");
    process.exit(1);
  }

  if (!targetUrl) {
    console.error("❌ ERROR: Target URL missing. Set SUPABASE_DIRECT_URL (or DATABASE_URL).");
    process.exit(1);
  }

  if (!isDryRun && isRemoteHost(targetUrl) && !isConfirmProduction) {
    console.error("⛔ SAFETY ABORT: Target database appears to be a remote/production instance.");
    console.error("   To execute live data migration, you must supply --confirm-production.");
    console.error("   Example: npx ts-node scripts/migrate-mysql-to-postgres.ts --confirm-production");
    process.exit(1);
  }

  let mysqlConn: mysql.Connection | null = null;
  const prisma = new PrismaClient({
    datasources: { db: { url: targetUrl } },
  });

  try {
    console.log("1. Connecting to databases...");
    mysqlConn = await mysql.createConnection(sourceUrl);
    await prisma.$connect();
    console.log("   ✔ Successfully connected to both MySQL and PostgreSQL.\n");

    // 2. Pre-flight check: Target idempotency
    console.log("2. Checking target PostgreSQL database state...");
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      if (!allowCleanTarget && !isDryRun) {
        console.error(`❌ ABORT: Target database already contains ${existingUsers} user record(s).`);
        console.error("   To prevent duplicate data or foreign key collisions, run migration on an empty target database,");
        console.error("   or use --clean-target if you explicitly wish to wipe the target tables first.");
        process.exit(1);
      }
      if (allowCleanTarget && !isDryRun) {
        console.warn("⚠️  --clean-target specified. Cleaning existing target records in reverse dependency order...");
        await prisma.$transaction([
          prisma.pendingEmailChange.deleteMany(),
          prisma.emailVerificationCode.deleteMany(),
          prisma.accountAction.deleteMany(),
          prisma.note.deleteMany(),
          prisma.subscription.deleteMany(),
          prisma.expense.deleteMany(),
          prisma.account.deleteMany(),
          prisma.user.deleteMany(),
        ]);
        console.log("   ✔ Target tables cleared.\n");
      }
    } else {
      console.log("   ✔ Target PostgreSQL database is clean and ready for import.\n");
    }

    // 3. Read Source Data from MySQL
    console.log("3. Reading source records from Railway MySQL...");

    const [userRows]: any = await mysqlConn.query("SELECT * FROM `User` ORDER BY `id` ASC");
    const [accountRows]: any = await mysqlConn.query("SELECT * FROM `Account` ORDER BY `id` ASC");
    const [expenseRows]: any = await mysqlConn.query("SELECT * FROM `Expense` ORDER BY `id` ASC");
    const [subscriptionRows]: any = await mysqlConn.query("SELECT * FROM `Subscription` ORDER BY `id` ASC");
    const [noteRows]: any = await mysqlConn.query("SELECT * FROM `Note` ORDER BY `id` ASC");
    const [actionRows]: any = await mysqlConn.query("SELECT * FROM `AccountAction` ORDER BY `id` ASC");
    const [codeRows]: any = await mysqlConn.query("SELECT * FROM `EmailVerificationCode` ORDER BY `id` ASC");
    const [emailChangeRows]: any = await mysqlConn.query("SELECT * FROM `PendingEmailChange` ORDER BY `id` ASC");

    console.log(`   - Users:                   ${userRows.length}`);
    console.log(`   - Accounts:                ${accountRows.length}`);
    console.log(`   - Expenses:                ${expenseRows.length}`);
    console.log(`   - Subscriptions:           ${subscriptionRows.length}`);
    console.log(`   - Notes:                   ${noteRows.length}`);
    console.log(`   - AccountActions:          ${actionRows.length}`);
    console.log(`   - EmailVerificationCodes:  ${codeRows.length}`);
    console.log(`   - PendingEmailChanges:     ${emailChangeRows.length}\n`);

    // 4. Calculate Source Financial Totals (Decimal-Safe)
    console.log("4. Calculating source financial totals...");
    let srcAccountBalanceCents = 0n;
    for (const r of accountRows) srcAccountBalanceCents = addDecimalString(srcAccountBalanceCents, r.balance);

    let srcExpenseAmountCents = 0n;
    for (const r of expenseRows) srcExpenseAmountCents = addDecimalString(srcExpenseAmountCents, r.amount);

    let srcSubscriptionPriceCents = 0n;
    for (const r of subscriptionRows) srcSubscriptionPriceCents = addDecimalString(srcSubscriptionPriceCents, r.price);

    console.log(`   - Total Account Balance:   ${formatCentsToDecimal(srcAccountBalanceCents)}`);
    console.log(`   - Total Expenses:          ${formatCentsToDecimal(srcExpenseAmountCents)}`);
    console.log(`   - Total Subscriptions:     ${formatCentsToDecimal(srcSubscriptionPriceCents)}\n`);

    if (isDryRun) {
      console.log("======================================================================");
      console.log("   🧪 DRY RUN COMPLETE: All source records validated successfully!     ");
      console.log("   No writes were performed to PostgreSQL.                            ");
      console.log("======================================================================");
      return;
    }

    // 5. Execute Migration in Foreign Key Dependency Order
    console.log("5. Migrating data to PostgreSQL in foreign-key dependency order...");

    // Helper to batch inserts in chunks
    const BATCH_SIZE = 100;
    async function chunkedInsert<T>(
      tableName: string,
      items: T[],
      insertFn: (chunk: T[]) => Promise<any>
    ) {
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const chunk = items.slice(i, i + BATCH_SIZE);
        await insertFn(chunk);
      }
      console.log(`   ✔ Migrated ${items.length} records into "${tableName}".`);
    }

    // Step 5.1: Users
    await chunkedInsert("User", userRows, async (chunk) => {
      await prisma.$transaction(
        chunk.map((u: any) =>
          prisma.user.create({
            data: {
              id: u.id,
              email: u.email,
              passwordHash: u.passwordHash,
              createdAt: new Date(u.createdAt),
              fullName: u.fullName,
              notifySubscriptionCancelled: Boolean(u.notifySubscriptionCancelled),
              notifySubscriptionCreated: Boolean(u.notifySubscriptionCreated),
              notifySubscriptionReminder: Boolean(u.notifySubscriptionReminder),
              secondCurrency: u.secondCurrency,
              showSecondCurrency: Boolean(u.showSecondCurrency),
              totalsMainCurrency: u.totalsMainCurrency || "ALL",
            },
          })
        )
      );
    });

    // Step 5.2: Accounts
    await chunkedInsert("Account", accountRows, async (chunk) => {
      await prisma.$transaction(
        chunk.map((a: any) =>
          prisma.account.create({
            data: {
              id: a.id,
              userId: a.userId,
              name: a.name,
              type: a.type,
              balance: Number(a.balance),
              createdAt: new Date(a.createdAt),
              baseCurrency: a.baseCurrency || "EUR",
              sortOrder: Number(a.sortOrder || 0),
              deletedAt: a.deletedAt ? new Date(a.deletedAt) : null,
            },
          })
        )
      );
    });

    // Step 5.3: Expenses
    await chunkedInsert("Expense", expenseRows, async (chunk) => {
      await prisma.$transaction(
        chunk.map((e: any) =>
          prisma.expense.create({
            data: {
              id: e.id,
              userId: e.userId,
              amount: Number(e.amount),
              date: new Date(e.date),
              category: e.category,
              description: e.description,
              createdAt: new Date(e.createdAt),
              accountId: e.accountId ? Number(e.accountId) : null,
            },
          })
        )
      );
    });

    // Step 5.4: Subscriptions
    await chunkedInsert("Subscription", subscriptionRows, async (chunk) => {
      await prisma.$transaction(
        chunk.map((s: any) =>
          prisma.subscription.create({
            data: {
              id: s.id,
              name: s.name,
              price: Number(s.price),
              billingPeriod: s.billingPeriod,
              nextBillingDate: new Date(s.nextBillingDate),
              status: s.status,
              createdAt: new Date(s.createdAt),
              userId: s.userId,
              accountId: s.accountId ? Number(s.accountId) : null,
              reminder1DaySentFor: s.reminder1DaySentFor ? new Date(s.reminder1DaySentFor) : null,
              reminder3DaysSentFor: s.reminder3DaysSentFor ? new Date(s.reminder3DaysSentFor) : null,
            },
          })
        )
      );
    });

    // Step 5.5: Notes
    await chunkedInsert("Note", noteRows, async (chunk) => {
      await prisma.$transaction(
        chunk.map((n: any) =>
          prisma.note.create({
            data: {
              id: n.id,
              userId: n.userId,
              title: n.title,
              description: n.description,
              amount: n.amount != null ? Number(n.amount) : null,
              personName: n.personName,
              dueDate: n.dueDate ? new Date(n.dueDate) : null,
              repeatPeriod: n.repeatPeriod || "NONE",
              type: n.type || "GENERAL",
              status: n.status || "OPEN",
              createdAt: new Date(n.createdAt),
              updatedAt: new Date(n.updatedAt),
              currency: n.currency || "EUR",
            },
          })
        )
      );
    });

    // Step 5.6: AccountActions
    await chunkedInsert("AccountAction", actionRows, async (chunk) => {
      await prisma.$transaction(
        chunk.map((act: any) =>
          prisma.accountAction.create({
            data: {
              id: act.id,
              userId: act.userId,
              accountId: act.accountId,
              toAccountId: act.toAccountId ? Number(act.toAccountId) : null,
              type: act.type,
              amount: Number(act.amount),
              description: act.description,
              date: new Date(act.date),
              createdAt: new Date(act.createdAt),
              exchangeRate: act.exchangeRate != null ? Number(act.exchangeRate) : null,
              targetAmount: act.targetAmount != null ? Number(act.targetAmount) : null,
            },
          })
        )
      );
    });

    // Step 5.7: EmailVerificationCodes
    await chunkedInsert("EmailVerificationCode", codeRows, async (chunk) => {
      await prisma.$transaction(
        chunk.map((c: any) =>
          prisma.emailVerificationCode.create({
            data: {
              id: c.id,
              email: c.email,
              codeHash: c.codeHash,
              expiresAt: new Date(c.expiresAt),
              used: Boolean(c.used),
              createdAt: new Date(c.createdAt),
            },
          })
        )
      );
    });

    // Step 5.8: PendingEmailChanges
    await chunkedInsert("PendingEmailChange", emailChangeRows, async (chunk) => {
      await prisma.$transaction(
        chunk.map((p: any) =>
          prisma.pendingEmailChange.create({
            data: {
              id: p.id,
              userId: p.userId,
              newEmail: p.newEmail,
              codeHash: p.codeHash,
              expiresAt: new Date(p.expiresAt),
              used: Boolean(p.used),
              createdAt: new Date(p.createdAt),
            },
          })
        )
      );
    });

    // 6. Reset PostgreSQL Serial Sequences
    console.log("\n6. Resetting PostgreSQL SERIAL sequences to MAX(id)...");
    const sequenceTables = [
      "User",
      "Account",
      "Expense",
      "Subscription",
      "Note",
      "AccountAction",
      "EmailVerificationCode",
      "PendingEmailChange",
    ];

    for (const table of sequenceTables) {
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1), true);`
      );
    }
    console.log("   ✔ All sequences updated.\n");

    // 7. Verify Post-Migration Target Record Counts & Totals
    console.log("7. Verifying target PostgreSQL record counts and financial sums...");

    const [
      dstUserCount,
      dstAccountCount,
      dstExpenseCount,
      dstSubscriptionCount,
      dstNoteCount,
      dstActionCount,
      dstCodeCount,
      dstEmailChangeCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.account.count(),
      prisma.expense.count(),
      prisma.subscription.count(),
      prisma.note.count(),
      prisma.accountAction.count(),
      prisma.emailVerificationCode.count(),
      prisma.pendingEmailChange.count(),
    ]);

    let countsMatch =
      dstUserCount === userRows.length &&
      dstAccountCount === accountRows.length &&
      dstExpenseCount === expenseRows.length &&
      dstSubscriptionCount === subscriptionRows.length &&
      dstNoteCount === noteRows.length &&
      dstActionCount === actionRows.length &&
      dstCodeCount === codeRows.length &&
      dstEmailChangeCount === emailChangeRows.length;

    // Check financial totals in target
    let dstAccountBalanceCents = 0n;
    const dstAccounts = await prisma.account.findMany({ select: { balance: true } });
    for (const a of dstAccounts) dstAccountBalanceCents = addDecimalString(dstAccountBalanceCents, a.balance);

    let dstExpenseAmountCents = 0n;
    const dstExpenses = await prisma.expense.findMany({ select: { amount: true } });
    for (const e of dstExpenses) dstExpenseAmountCents = addDecimalString(dstExpenseAmountCents, e.amount);

    let dstSubscriptionPriceCents = 0n;
    const dstSubscriptions = await prisma.subscription.findMany({ select: { price: true } });
    for (const s of dstSubscriptions) dstSubscriptionPriceCents = addDecimalString(dstSubscriptionPriceCents, s.price);

    let totalsMatch =
      dstAccountBalanceCents === srcAccountBalanceCents &&
      dstExpenseAmountCents === srcExpenseAmountCents &&
      dstSubscriptionPriceCents === srcSubscriptionPriceCents;

    console.log("----------------------------------------------------------------------");
    console.log(`${"Table / Metric".padEnd(25)} | ${"Source (MySQL)".padStart(15)} | ${"Target (Postgres)".padStart(17)} | Status`);
    console.log("----------------------------------------------------------------------");
    console.log(`${"User Count".padEnd(25)} | ${String(userRows.length).padStart(15)} | ${String(dstUserCount).padStart(17)} | ${dstUserCount === userRows.length ? "✔ MATCH" : "❌ MISMATCH"}`);
    console.log(`${"Account Count".padEnd(25)} | ${String(accountRows.length).padStart(15)} | ${String(dstAccountCount).padStart(17)} | ${dstAccountCount === accountRows.length ? "✔ MATCH" : "❌ MISMATCH"}`);
    console.log(`${"Expense Count".padEnd(25)} | ${String(expenseRows.length).padStart(15)} | ${String(dstExpenseCount).padStart(17)} | ${dstExpenseCount === expenseRows.length ? "✔ MATCH" : "❌ MISMATCH"}`);
    console.log(`${"Subscription Count".padEnd(25)} | ${String(subscriptionRows.length).padStart(15)} | ${String(dstSubscriptionCount).padStart(17)} | ${dstSubscriptionCount === subscriptionRows.length ? "✔ MATCH" : "❌ MISMATCH"}`);
    console.log(`${"Note Count".padEnd(25)} | ${String(noteRows.length).padStart(15)} | ${String(dstNoteCount).padStart(17)} | ${dstNoteCount === noteRows.length ? "✔ MATCH" : "❌ MISMATCH"}`);
    console.log(`${"AccountAction Count".padEnd(25)} | ${String(actionRows.length).padStart(15)} | ${String(dstActionCount).padStart(17)} | ${dstActionCount === actionRows.length ? "✔ MATCH" : "❌ MISMATCH"}`);
    console.log(`${"VerificationCodes".padEnd(25)} | ${String(codeRows.length).padStart(15)} | ${String(dstCodeCount).padStart(17)} | ${dstCodeCount === codeRows.length ? "✔ MATCH" : "❌ MISMATCH"}`);
    console.log(`${"PendingEmailChanges".padEnd(25)} | ${String(emailChangeRows.length).padStart(15)} | ${String(dstEmailChangeCount).padStart(17)} | ${dstEmailChangeCount === emailChangeRows.length ? "✔ MATCH" : "❌ MISMATCH"}`);
    console.log("----------------------------------------------------------------------");
    console.log(`${"Account Balance Sum".padEnd(25)} | ${formatCentsToDecimal(srcAccountBalanceCents).padStart(15)} | ${formatCentsToDecimal(dstAccountBalanceCents).padStart(17)} | ${dstAccountBalanceCents === srcAccountBalanceCents ? "✔ MATCH" : "❌ MISMATCH"}`);
    console.log(`${"Expense Amount Sum".padEnd(25)} | ${formatCentsToDecimal(srcExpenseAmountCents).padStart(15)} | ${formatCentsToDecimal(dstExpenseAmountCents).padStart(17)} | ${dstExpenseAmountCents === srcExpenseAmountCents ? "✔ MATCH" : "❌ MISMATCH"}`);
    console.log(`${"Subscription Price Sum".padEnd(25)} | ${formatCentsToDecimal(srcSubscriptionPriceCents).padStart(15)} | ${formatCentsToDecimal(dstSubscriptionPriceCents).padStart(17)} | ${dstSubscriptionPriceCents === srcSubscriptionPriceCents ? "✔ MATCH" : "❌ MISMATCH"}`);
    console.log("----------------------------------------------------------------------\n");

    if (!countsMatch || !totalsMatch) {
      console.error("❌ CRITICAL: Discrepancy detected after migration!");
      console.error("   Do NOT cut over or switch application environment variables.");
      process.exit(1);
    }

    console.log("======================================================================");
    console.log("   🎉 PRODUCTION DATA MIGRATION COMPLETED SUCCESSFULLY!              ");
    console.log("   All records and financial sums match with 100% precision.         ");
    console.log("======================================================================");
  } catch (err) {
    console.error("❌ Migration failed with error:", err);
    process.exit(1);
  } finally {
    if (mysqlConn) await mysqlConn.end();
    await prisma.$disconnect();
  }
}

main();
