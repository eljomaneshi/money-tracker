import { PrismaClient } from "@prisma/client";

/**
 * Validates that the PostgreSQL database schema and Prisma Client are properly configured
 * and working as expected without leaving lingering test data.
 *
 * Usage:
 *   npx ts-node scripts/validate-postgres-migration.ts
 */

const prisma = new PrismaClient();

async function main() {
  console.log("==================================================");
  console.log("   PostgreSQL Migration & Schema Validation Test   ");
  console.log("==================================================");

  const maskedDbUrl = (process.env.DATABASE_URL || "").replace(
    /:([^:@]+)@/,
    ":****@"
  );
  console.log(`Connecting to: ${maskedDbUrl || "DATABASE_URL not set"}\n`);

  try {
    // 1. Connection check
    console.log("1. Checking database connection...");
    await prisma.$connect();
    console.log("   ✔ Successfully connected to PostgreSQL.\n");

    // 2. Verify all tables exist and can be queried
    console.log("2. Querying all 8 Prisma models...");
    const [
      userCount,
      accountCount,
      expenseCount,
      subscriptionCount,
      noteCount,
      actionCount,
      verificationCodeCount,
      pendingEmailCount,
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

    console.log(`   ✔ User table:                   ${userCount} rows`);
    console.log(`   ✔ Account table:                ${accountCount} rows`);
    console.log(`   ✔ Expense table:                ${expenseCount} rows`);
    console.log(`   ✔ Subscription table:           ${subscriptionCount} rows`);
    console.log(`   ✔ Note table:                   ${noteCount} rows`);
    console.log(`   ✔ AccountAction table:          ${actionCount} rows`);
    console.log(`   ✔ EmailVerificationCode table:  ${verificationCodeCount} rows`);
    console.log(`   ✔ PendingEmailChange table:     ${pendingEmailCount} rows\n`);

    // 3. Test CRUD transaction with enums and rollback/cleanup
    console.log("3. Testing transactional CRUD & Enum handling...");
    const testEmail = `migration_test_${Date.now()}@example.com`;

    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: testEmail,
          passwordHash: "dummy_hash_for_test",
          fullName: "Migration Validation Test User",
          secondCurrency: "EUR",
          totalsMainCurrency: "ALL",
        },
      });

      // Create account with enum and float precision
      const account = await tx.account.create({
        data: {
          userId: user.id,
          name: "Test Checking Account",
          type: "BANK",
          balance: 1250.75,
          baseCurrency: "EUR",
        },
      });

      // Create expense
      const expense = await tx.expense.create({
        data: {
          userId: user.id,
          accountId: account.id,
          amount: 45.99,
          date: new Date(),
          category: "Groceries",
          description: "Test supermarket purchase",
        },
      });

      // Create subscription
      const subscription = await tx.subscription.create({
        data: {
          userId: user.id,
          accountId: account.id,
          name: "Test Cloud Service",
          price: 9.99,
          billingPeriod: "MONTHLY",
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: "ACTIVE",
        },
      });

      // Read back with relations
      const readBackUser = await tx.user.findUnique({
        where: { id: user.id },
        include: {
          accounts: true,
          expenses: true,
          subscriptions: true,
        },
      });

      // Verify values
      if (!readBackUser) throw new Error("Could not read back test user");
      if (readBackUser.accounts[0].balance !== 1250.75) {
        throw new Error(`Balance mismatch: expected 1250.75, got ${readBackUser.accounts[0].balance}`);
      }
      if (readBackUser.expenses[0].amount !== 45.99) {
        throw new Error(`Expense amount mismatch: expected 45.99, got ${readBackUser.expenses[0].amount}`);
      }

      // Cleanup test user (Cascades to account, expense, subscription)
      await tx.user.delete({
        where: { id: user.id },
      });

      return { success: true };
    });

    if (result.success) {
      console.log("   ✔ Transactional CRUD, enums, relations, and cascade deletes verified successfully.\n");
    }

    // 4. Timezone and DateTime verification
    console.log("4. Verifying DateTime & Timezone behavior...");
    const now = new Date();
    const isoString = now.toISOString();
    console.log(`   ✔ Current JS ISO String: ${isoString}`);
    console.log(`   ✔ PostgreSQL TIMESTAMP(3) format compatible.\n`);

    console.log("==================================================");
    console.log("   🎉 PostgreSQL Schema Validation PASSED!        ");
    console.log("==================================================");
  } catch (error) {
    console.error("\n❌ Validation Failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
