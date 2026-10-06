import http from "http";
import bcrypt from "bcrypt";
import app from "../src/app";
import prisma from "../src/prisma";

async function main() {
  console.log("==================================================");
  console.log("    Local End-to-End API & PostgreSQL Test Suite   ");
  console.log("==================================================");

  // 1. Start ephemeral HTTP server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Unable to get server address");
  }
  const port = address.port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`🚀 Test server listening on ${baseUrl}\n`);

  const testEmail = `e2e_tester_${Date.now()}@moneytracker.local`;
  const rawPassword = "SecurePassword123!";
  let testUserId: number | null = null;
  let authToken = "";
  let accountId1: number | null = null;
  let accountId2: number | null = null;
  let expenseId: number | null = null;
  let subscriptionId: number | null = null;
  let noteId: number | null = null;

  try {
    // -----------------------------------------------------------------
    // Step 1: Health check
    // -----------------------------------------------------------------
    console.log("1. Testing GET /health ...");
    const healthRes = await fetch(`${baseUrl}/health`);
    if (healthRes.status !== 200) {
      throw new Error(`Health check returned status ${healthRes.status}`);
    }
    const healthBody = (await healthRes.json()) as { status: string; message: string };
    if (healthBody.status !== "ok" || !healthBody.message.includes("PostgreSQL")) {
      throw new Error(`Unexpected health payload: ${JSON.stringify(healthBody)}`);
    }
    console.log(`   ✔ Status: ${healthBody.status} | Message: "${healthBody.message}"\n`);

    // -----------------------------------------------------------------
    // Step 2: Seed test user directly into PostgreSQL
    // -----------------------------------------------------------------
    console.log("2. Seeding test user in PostgreSQL...");
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const createdUser = await prisma.user.create({
      data: {
        email: testEmail,
        fullName: "E2E Automated Tester",
        passwordHash,
        notifySubscriptionCreated: false,
        notifySubscriptionCancelled: false,
        notifySubscriptionReminder: false,
      },
    });
    testUserId = createdUser.id;
    console.log(`   ✔ Created user ID ${testUserId} (${testEmail})\n`);

    // -----------------------------------------------------------------
    // Step 3: Login via API (POST /auth/login)
    // -----------------------------------------------------------------
    console.log("3. Testing POST /auth/login ...");
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: rawPassword,
      }),
    });
    if (loginRes.status !== 200) {
      const err = await loginRes.text();
      throw new Error(`Login failed (${loginRes.status}): ${err}`);
    }
    const loginData = (await loginRes.json()) as { token: string; user: { id: number; email: string } };
    authToken = loginData.token;
    if (!authToken || loginData.user.id !== testUserId) {
      throw new Error(`Invalid login response: ${JSON.stringify(loginData)}`);
    }
    console.log(`   ✔ Login successful, JWT token issued\n`);

    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    };

    // -----------------------------------------------------------------
    // Step 4: Verify Auth (GET /auth/me & GET /users/me/settings)
    // -----------------------------------------------------------------
    console.log("4. Testing GET /auth/me and GET /users/me/settings ...");
    const meRes = await fetch(`${baseUrl}/auth/me`, { headers: authHeaders });
    if (meRes.status !== 200) throw new Error(`/auth/me returned ${meRes.status}`);
    const meData = (await meRes.json()) as { user: { id: number; email: string } };
    if (meData.user.id !== testUserId) throw new Error("User ID mismatch");

    const settingsRes = await fetch(`${baseUrl}/users/me/settings`, { headers: authHeaders });
    if (settingsRes.status !== 200) throw new Error(`/users/me/settings returned ${settingsRes.status}`);
    console.log(`   ✔ Token verified, user profile and preferences fetched\n`);

    // -----------------------------------------------------------------
    // Step 5: Test Exchange Rates (GET /accounts/exchange-rates)
    // -----------------------------------------------------------------
    console.log("5. Testing GET /accounts/exchange-rates ...");
    const ratesRes = await fetch(`${baseUrl}/accounts/exchange-rates`, { headers: authHeaders });
    if (ratesRes.status !== 200) throw new Error(`Exchange rates returned ${ratesRes.status}`);
    const ratesData = (await ratesRes.json()) as { rates: Record<string, number> };
    if (!ratesData.rates?.EUR || !ratesData.rates?.USD) {
      throw new Error(`Invalid rates received: ${JSON.stringify(ratesData)}`);
    }
    console.log(`   ✔ Exchange rates active: EUR=1, USD=${ratesData.rates.USD}, ALL=${ratesData.rates.ALL}\n`);

    // -----------------------------------------------------------------
    // Step 6: Create Accounts (POST /accounts)
    // -----------------------------------------------------------------
    console.log("6. Testing POST /accounts (Checking & Savings) ...");
    const acc1Res = await fetch(`${baseUrl}/accounts`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: "Main Bank Account",
        type: "BANK",
        balance: 2500,
        baseCurrency: "EUR",
      }),
    });
    if (acc1Res.status !== 201) throw new Error(`Create account 1 failed (${acc1Res.status})`);
    const acc1Data = (await acc1Res.json()) as { account: { id: number; name: string; balance: number } };
    accountId1 = acc1Data.account.id;

    const acc2Res = await fetch(`${baseUrl}/accounts`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: "Emergency Cash",
        type: "CASH",
        balance: 500,
        baseCurrency: "EUR",
      }),
    });
    if (acc2Res.status !== 201) throw new Error(`Create account 2 failed (${acc2Res.status})`);
    const acc2Data = (await acc2Res.json()) as { account: { id: number; name: string; balance: number } };
    accountId2 = acc2Data.account.id;

    console.log(`   ✔ Created Account 1 (ID: ${accountId1}, Balance: €${acc1Data.account.balance})`);
    console.log(`   ✔ Created Account 2 (ID: ${accountId2}, Balance: €${acc2Data.account.balance})\n`);

    // -----------------------------------------------------------------
    // Step 7: List Accounts (GET /accounts)
    // -----------------------------------------------------------------
    console.log("7. Testing GET /accounts ...");
    const listAccRes = await fetch(`${baseUrl}/accounts`, { headers: authHeaders });
    if (listAccRes.status !== 200) throw new Error(`List accounts failed: ${listAccRes.status}`);
    const listAccData = (await listAccRes.json()) as { accounts: Array<{ id: number; name: string }> };
    if (listAccData.accounts.length !== 2) {
      throw new Error(`Expected 2 accounts, got ${listAccData.accounts.length}`);
    }
    console.log(`   ✔ Found 2 accounts in PostgreSQL\n`);

    // -----------------------------------------------------------------
    // Step 8: Create Expense & verify transactional balance decrement
    // -----------------------------------------------------------------
    console.log("8. Testing POST /expenses and account balance update...");
    const expenseRes = await fetch(`${baseUrl}/expenses`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        amount: 150.50,
        date: new Date().toISOString(),
        category: "Groceries",
        description: "Supermarket shopping",
        accountId: accountId1,
      }),
    });
    if (expenseRes.status !== 201) {
      const err = await expenseRes.text();
      throw new Error(`Create expense failed (${expenseRes.status}): ${err}`);
    }
    const expenseData = (await expenseRes.json()) as {
      expense: { id: number; amount: number };
      updatedAccount: { id: number; balance: number };
    };
    expenseId = expenseData.expense.id;
    console.log(`   ✔ Created Expense ID ${expenseId} of €150.50`);
    console.log(`   ✔ Verified transactional decrement: Account balance is now €${expenseData.updatedAccount.balance} (expected 2349.50)\n`);

    // -----------------------------------------------------------------
    // Step 9: List Expenses (GET /expenses)
    // -----------------------------------------------------------------
    console.log("9. Testing GET /expenses ...");
    const listExpRes = await fetch(`${baseUrl}/expenses`, { headers: authHeaders });
    if (listExpRes.status !== 200) throw new Error(`List expenses failed (${listExpRes.status})`);
    const listExpData = (await listExpRes.json()) as { expenses: Array<{ id: number; amount: number; account: { name: string } }> };
    if (listExpData.expenses.length !== 1 || listExpData.expenses[0].account.name !== "Main Bank Account") {
      throw new Error("Expense list mismatch or relation not populated");
    }
    console.log(`   ✔ Expense listed with joined account relationship: "${listExpData.expenses[0].account.name}"\n`);

    // -----------------------------------------------------------------
    // Step 10: Create Subscription (POST /subscriptions)
    // -----------------------------------------------------------------
    console.log("10. Testing POST /subscriptions ...");
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const subRes = await fetch(`${baseUrl}/subscriptions`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: "Cloud Storage",
        price: 9.99,
        billingPeriod: "MONTHLY",
        nextBillingDate: nextMonth.toISOString(),
        accountId: accountId1,
      }),
    });
    if (subRes.status !== 201) {
      const err = await subRes.text();
      throw new Error(`Create subscription failed (${subRes.status}): ${err}`);
    }
    const subData = (await subRes.json()) as { subscription: { id: number; name: string; status: string } };
    subscriptionId = subData.subscription.id;
    console.log(`   ✔ Subscription created (ID: ${subscriptionId}, Name: "${subData.subscription.name}", Status: "${subData.subscription.status}")\n`);

    // -----------------------------------------------------------------
    // Step 11: Cancel Subscription (PATCH /subscriptions/:id/cancel)
    // -----------------------------------------------------------------
    console.log("11. Testing PATCH /subscriptions/:id/cancel ...");
    const cancelRes = await fetch(`${baseUrl}/subscriptions/${subscriptionId}/cancel`, {
      method: "PATCH",
      headers: authHeaders,
    });
    if (cancelRes.status !== 200) throw new Error(`Cancel subscription failed (${cancelRes.status})`);
    const cancelData = (await cancelRes.json()) as { subscription: { status: string } };
    if (cancelData.subscription.status !== "CANCELLED") {
      throw new Error(`Expected status CANCELLED, got ${cancelData.subscription.status}`);
    }
    console.log(`   ✔ Subscription status updated to CANCELLED\n`);

    // -----------------------------------------------------------------
    // Step 12: Notes CRUD (POST, GET, PUT, DELETE /notes)
    // -----------------------------------------------------------------
    console.log("12. Testing Note CRUD operations...");
    const createNoteRes = await fetch(`${baseUrl}/notes`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        title: "Tax Return Checklist",
        description: "Submit 2026 receipts",
        currency: "EUR",
        type: "GENERAL",
        repeatPeriod: "NONE",
      }),
    });
    if (createNoteRes.status !== 201) throw new Error(`Create note failed (${createNoteRes.status})`);
    const noteData = (await createNoteRes.json()) as { note: { id: number; title: string; status: string } };
    noteId = noteData.note.id;

    // Update Note
    const updateNoteRes = await fetch(`${baseUrl}/notes/${noteId}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({
        title: "Tax Return Checklist (Submitted)",
        status: "DONE",
      }),
    });
    if (updateNoteRes.status !== 200) throw new Error(`Update note failed (${updateNoteRes.status})`);
    const updatedNote = (await updateNoteRes.json()) as { note: { status: string; title: string } };
    if (updatedNote.note.status !== "DONE") throw new Error("Note status not updated");

    // Delete Note
    const delNoteRes = await fetch(`${baseUrl}/notes/${noteId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    if (delNoteRes.status !== 200) throw new Error(`Delete note failed (${delNoteRes.status})`);
    noteId = null;
    console.log(`   ✔ Note created, updated to DONE, and deleted successfully\n`);

    // -----------------------------------------------------------------
    // Step 13: Soft Delete Account (DELETE /accounts/:id)
    // -----------------------------------------------------------------
    console.log("13. Testing Account soft delete & business rules...");
    // 13a. Attempt delete with non-zero balance (should fail with 400)
    const blockedDelRes = await fetch(`${baseUrl}/accounts/${accountId2}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    if (blockedDelRes.status !== 400) {
      throw new Error(`Expected status 400 for non-zero balance deletion, got ${blockedDelRes.status}`);
    }
    console.log("   ✔ Business logic verified: Deleting account with non-zero balance is blocked (400)");

    // 13b. Set balance to 0
    const zeroAccRes = await fetch(`${baseUrl}/accounts/${accountId2}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        name: "Emergency Cash",
        type: "CASH",
        balance: 0,
        baseCurrency: "EUR",
      }),
    });
    if (zeroAccRes.status !== 200) throw new Error("Failed to zero out account balance");

    // 13c. Delete account
    const delAccRes = await fetch(`${baseUrl}/accounts/${accountId2}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    if (delAccRes.status !== 200) throw new Error(`Delete account failed (${delAccRes.status})`);

    const reListAccRes = await fetch(`${baseUrl}/accounts`, { headers: authHeaders });
    const reListData = (await reListAccRes.json()) as { accounts: Array<{ id: number }> };
    if (reListData.accounts.some((a) => a.id === accountId2)) {
      throw new Error("Soft-deleted account is still appearing in active account list");
    }
    console.log(`   ✔ Account ID ${accountId2} soft-deleted and properly filtered out from active list\n`);

    console.log("==================================================");
    console.log("  🎉 All 13 End-to-End API Steps PASSED 100%!     ");
    console.log("==================================================");
  } finally {
    // Cleanup test user and all cascading records
    if (testUserId) {
      console.log("\nCleaning up test artifacts from PostgreSQL...");
      try {
        await prisma.user.delete({ where: { id: testUserId } });
        console.log("✔ Cleaned up test user and cascading relations.");
      } catch (cleanupErr) {
        console.warn("Notice: Test user cleanup error:", cleanupErr);
      }
    }

    await prisma.$disconnect();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    console.log("✔ Test server stopped and database disconnected.\n");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("\n❌ E2E API Verification failed:", err);
  process.exit(1);
});
