process.env.SECURITY_TEST_MODE = "true";

import http from "http";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import app from "../src/app";
import prisma from "../src/prisma";
import { JWT_SECRET } from "../src/config";
import {
  loginLimiter,
  requestCodeLimiter,
  submitCodeLimiter,
} from "../src/middleware/rateLimiter";

function hashVerificationCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function resetAllRateLimiters() {
  for (const ip of ["127.0.0.1", "::1", "::ffff:127.0.0.1"]) {
    loginLimiter.resetKey(ip);
    requestCodeLimiter.resetKey(ip);
    submitCodeLimiter.resetKey(ip);
  }
}

async function main() {
  console.log("==================================================");
  console.log("    Verification Security & Rate Limiting Suite   ");
  console.log("==================================================");

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Unable to get server address");
  }
  const port = address.port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`🚀 Test server listening on ${baseUrl}\n`);

  const createdUserIds: number[] = [];
  const testEmails: string[] = [];

  try {
    resetAllRateLimiters();

    // -------------------------------------------------------------------------
    // 1. A new code starts with failedAttempts = 0 and used = false
    // -------------------------------------------------------------------------
    console.log("1. Testing new verification code initialization (failedAttempts = 0)...");
    const email1 = `init_test_${Date.now()}@moneytracker.local`;
    testEmails.push(email1);

    const reqRes = await fetch(`${baseUrl}/auth/request-register-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email1 }),
    });
    if (reqRes.status !== 200) {
      throw new Error(`request-register-code failed with status ${reqRes.status}`);
    }

    const initialRecord = await prisma.emailVerificationCode.findFirst({
      where: { email: email1, used: false },
      orderBy: { createdAt: "desc" },
    });

    if (!initialRecord) {
      throw new Error("Failed to find created verification record");
    }
    if (initialRecord.failedAttempts !== 0) {
      throw new Error(`Expected failedAttempts=0, got ${initialRecord.failedAttempts}`);
    }
    if (initialRecord.used !== false) {
      throw new Error(`Expected used=false, got ${initialRecord.used}`);
    }
    console.log(`   ✔ Verified: failedAttempts = ${initialRecord.failedAttempts}, used = ${initialRecord.used}\n`);

    resetAllRateLimiters();

    // -------------------------------------------------------------------------
    // 2. A correct code before the 5th failure succeeds
    // -------------------------------------------------------------------------
    console.log("2. Testing correct code before 5th failure (retries succeed)...");
    const email2 = `retry_test_${Date.now()}@moneytracker.local`;
    testEmails.push(email2);
    const validCode2 = "123456";
    const record2 = await prisma.emailVerificationCode.create({
      data: {
        email: email2,
        codeHash: hashVerificationCode(validCode2),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        failedAttempts: 0,
        used: false,
      },
    });

    // 2 invalid attempts
    for (let i = 1; i <= 2; i++) {
      const failRes = await fetch(`${baseUrl}/auth/register-with-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Retry Tester",
          email: email2,
          code: "999999",
          password: "Password123!",
        }),
      });
      if (failRes.status !== 400) {
        throw new Error(`Expected 400 for bad code, got ${failRes.status}`);
      }
      const body = (await failRes.json()) as { error: string };
      if (!body.error.includes(`${5 - i} attempts remaining`)) {
        throw new Error(`Unexpected error message: ${body.error}`);
      }
    }

    // Verify DB count is now 2
    const intermediateRecord = await prisma.emailVerificationCode.findUnique({
      where: { id: record2.id },
    });
    if (intermediateRecord?.failedAttempts !== 2 || intermediateRecord?.used !== false) {
      throw new Error(`Expected failedAttempts=2, used=false. Got: ${JSON.stringify(intermediateRecord)}`);
    }

    // Now submit the correct code
    const successRes = await fetch(`${baseUrl}/auth/register-with-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Retry Tester",
        email: email2,
        code: validCode2,
        password: "Password123!",
      }),
    });
    if (successRes.status !== 201) {
      const errText = await successRes.text();
      throw new Error(`Expected 201 for valid code, got ${successRes.status}: ${errText}`);
    }
    const successBody = (await successRes.json()) as { user: { id: number } };
    createdUserIds.push(successBody.user.id);

    const postSuccessRecord = await prisma.emailVerificationCode.findUnique({
      where: { id: record2.id },
    });
    if (postSuccessRecord?.used !== true || postSuccessRecord?.failedAttempts !== 2) {
      throw new Error(`Expected used=true, failedAttempts=2. Got: ${JSON.stringify(postSuccessRecord)}`);
    }
    console.log("   ✔ Verified: Retries incremented failedAttempts to 2; correct code consumed record (used=true)\n");

    resetAllRateLimiters();

    // -------------------------------------------------------------------------
    // 3. 5th invalid code invalidates the record
    // -------------------------------------------------------------------------
    console.log("3. Testing 5th invalid code invalidation...");
    const email3 = `lockout_test_${Date.now()}@moneytracker.local`;
    testEmails.push(email3);
    const validCode3 = "234567";
    const record3 = await prisma.emailVerificationCode.create({
      data: {
        email: email3,
        codeHash: hashVerificationCode(validCode3),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        failedAttempts: 0,
        used: false,
      },
    });

    for (let attempt = 1; attempt <= 4; attempt++) {
      const res = await fetch(`${baseUrl}/auth/register-with-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Lockout Tester",
          email: email3,
          code: "000000",
          password: "Password123!",
        }),
      });
      if (res.status !== 400) {
        throw new Error(`Attempt ${attempt} returned unexpected status ${res.status}`);
      }
    }

    // 5th attempt
    const fifthRes = await fetch(`${baseUrl}/auth/register-with-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Lockout Tester",
        email: email3,
        code: "000000",
        password: "Password123!",
      }),
    });
    if (fifthRes.status !== 400) {
      throw new Error(`5th attempt returned unexpected status ${fifthRes.status}`);
    }
    const fifthBody = (await fifthRes.json()) as { error: string };
    if (!fifthBody.error.includes("invalidated")) {
      throw new Error(`Expected invalidation error, got: ${fifthBody.error}`);
    }

    const postLockoutRecord = await prisma.emailVerificationCode.findUnique({
      where: { id: record3.id },
    });
    if (postLockoutRecord?.failedAttempts !== 5 || postLockoutRecord?.used !== true) {
      throw new Error(`Expected failedAttempts=5, used=true. Got: ${JSON.stringify(postLockoutRecord)}`);
    }
    console.log("   ✔ Verified: 5th failure set failedAttempts = 5 and atomically marked used = true\n");

    // -------------------------------------------------------------------------
    // 4. A correct code after invalidation fails
    // -------------------------------------------------------------------------
    console.log("4. Testing correct code after invalidation fails...");
    const afterLockoutRes = await fetch(`${baseUrl}/auth/register-with-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Lockout Tester",
        email: email3,
        code: validCode3,
        password: "Password123!",
      }),
    });
    if (afterLockoutRes.status !== 400) {
      throw new Error(`Expected 400 when submitting code for invalidated record, got ${afterLockoutRes.status}`);
    }
    console.log("   ✔ Verified: Correct code rejected after invalidation\n");

    resetAllRateLimiters();

    // -------------------------------------------------------------------------
    // 5. Expired codes do not increment failedAttempts
    // -------------------------------------------------------------------------
    console.log("5. Testing expired code does not increment failedAttempts...");
    const email5 = `expired_test_${Date.now()}@moneytracker.local`;
    testEmails.push(email5);
    const expiredRecord = await prisma.emailVerificationCode.create({
      data: {
        email: email5,
        codeHash: hashVerificationCode("555555"),
        expiresAt: new Date(Date.now() - 60 * 1000), // 1 min ago
        failedAttempts: 0,
        used: false,
      },
    });

    const expRes = await fetch(`${baseUrl}/auth/register-with-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Expired Tester",
        email: email5,
        code: "999999",
        password: "Password123!",
      }),
    });
    if (expRes.status !== 400) {
      throw new Error(`Expected 400 for expired code, got ${expRes.status}`);
    }
    const expBody = (await expRes.json()) as { error: string };
    if (!expBody.error.includes("expired")) {
      throw new Error(`Expected expired error message, got: ${expBody.error}`);
    }

    const postExpRecord = await prisma.emailVerificationCode.findUnique({
      where: { id: expiredRecord.id },
    });
    if (postExpRecord?.failedAttempts !== 0) {
      throw new Error(`Expected failedAttempts=0, got ${postExpRecord?.failedAttempts}`);
    }
    console.log("   ✔ Verified: Expired submission returned error without incrementing failedAttempts (still 0)\n");

    resetAllRateLimiters();

    // -------------------------------------------------------------------------
    // 6. Already-used codes do not increment failedAttempts
    // -------------------------------------------------------------------------
    console.log("6. Testing already-used code does not increment failedAttempts...");
    const email6 = `used_test_${Date.now()}@moneytracker.local`;
    testEmails.push(email6);
    const usedRecord = await prisma.emailVerificationCode.create({
      data: {
        email: email6,
        codeHash: hashVerificationCode("666666"),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        failedAttempts: 0,
        used: true,
      },
    });

    const usedRes = await fetch(`${baseUrl}/auth/register-with-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Used Tester",
        email: email6,
        code: "999999",
        password: "Password123!",
      }),
    });
    if (usedRes.status !== 400) {
      throw new Error(`Expected 400 for used code, got ${usedRes.status}`);
    }

    const postUsedRecord = await prisma.emailVerificationCode.findUnique({
      where: { id: usedRecord.id },
    });
    if (postUsedRecord?.failedAttempts !== 0) {
      throw new Error(`Expected failedAttempts=0, got ${postUsedRecord?.failedAttempts}`);
    }
    console.log("   ✔ Verified: Already-used code does not increment failedAttempts\n");

    resetAllRateLimiters();

    // -------------------------------------------------------------------------
    // 7. Email-change flow protection
    // -------------------------------------------------------------------------
    console.log("7. Testing email-change attempt protection...");
    const emailChangeUser = await prisma.user.create({
      data: {
        email: `email_change_user_${Date.now()}@moneytracker.local`,
        fullName: "Email Change Tester",
        passwordHash: await bcrypt.hash("Password123!", 10),
      },
    });
    createdUserIds.push(emailChangeUser.id);
    const token = jwt.sign({ userId: emailChangeUser.id }, JWT_SECRET, { expiresIn: "1h" });

    const newTargetEmail = `new_email_${Date.now()}@moneytracker.local`;
    const pendingChange = await prisma.pendingEmailChange.create({
      data: {
        userId: emailChangeUser.id,
        newEmail: newTargetEmail,
        codeHash: hashVerificationCode("345678"),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        failedAttempts: 0,
        used: false,
      },
    });

    // Submit 5 invalid attempts to confirm-email-change
    for (let attempt = 1; attempt <= 5; attempt++) {
      const res = await fetch(`${baseUrl}/auth/confirm-email-change`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newEmail: newTargetEmail,
          code: "000000",
        }),
      });
      if (res.status !== 400) {
        throw new Error(`Email change attempt ${attempt} returned status ${res.status}`);
      }
      if (attempt === 5) {
        const body = (await res.json()) as { error: string };
        if (!body.error.includes("invalidated")) {
          throw new Error(`Expected 5th attempt invalidation message, got ${body.error}`);
        }
      }
    }

    const postChangeRecord = await prisma.pendingEmailChange.findUnique({
      where: { id: pendingChange.id },
    });
    if (postChangeRecord?.failedAttempts !== 5 || postChangeRecord?.used !== true) {
      throw new Error(`Expected pendingChange failedAttempts=5, used=true. Got: ${JSON.stringify(postChangeRecord)}`);
    }

    // Verify correct code is rejected now
    const afterLockoutChangeRes = await fetch(`${baseUrl}/auth/confirm-email-change`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        newEmail: newTargetEmail,
        code: "345678",
      }),
    });
    if (afterLockoutChangeRes.status !== 400) {
      throw new Error(`Expected 400 after invalidation, got ${afterLockoutChangeRes.status}`);
    }
    console.log("   ✔ Verified: Email change protection enforces 5-attempt limit and marks used=true\n");

    resetAllRateLimiters();

    // -------------------------------------------------------------------------
    // 8. Rate limiters return HTTP 429 at configured thresholds
    // -------------------------------------------------------------------------
    console.log("8. Testing rate limiters return HTTP 429 at configured thresholds...");

    // Test loginLimiter (threshold: 10 requests per 15 min)
    console.log("   Testing loginLimiter (10 max)...");
    let login429Triggered = false;
    for (let i = 1; i <= 11; i++) {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "rate_limit_test@example.com",
          password: "bad_password",
        }),
      });
      if (res.status === 429) {
        login429Triggered = true;
        const body = (await res.json()) as { error: string };
        if (!body.error.includes("Too many login attempts")) {
          throw new Error(`Unexpected 429 login message: ${body.error}`);
        }
        break;
      }
    }
    if (!login429Triggered) {
      throw new Error("loginLimiter failed to trigger HTTP 429");
    }
    console.log("   ✔ loginLimiter returned HTTP 429 at 11th request (limit=10)");

    // Test requestCodeLimiter (threshold: 5 requests per 15 min)
    console.log("   Testing requestCodeLimiter (5 max)...");
    let request429Triggered = false;
    for (let i = 1; i <= 6; i++) {
      const res = await fetch(`${baseUrl}/auth/request-register-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `rate_req_${i}@moneytracker.local`,
        }),
      });
      if (res.status === 429) {
        request429Triggered = true;
        const body = (await res.json()) as { error: string };
        if (!body.error.includes("Too many verification code requests")) {
          throw new Error(`Unexpected 429 request code message: ${body.error}`);
        }
        break;
      }
    }
    if (!request429Triggered) {
      throw new Error("requestCodeLimiter failed to trigger HTTP 429");
    }
    console.log("   ✔ requestCodeLimiter returned HTTP 429 at 6th request (limit=5)");

    // Test submitCodeLimiter (threshold: 10 requests per 15 min)
    console.log("   Testing submitCodeLimiter (10 max)...");
    let submit429Triggered = false;
    for (let i = 1; i <= 11; i++) {
      const res = await fetch(`${baseUrl}/auth/register-with-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Submit Limiter Tester",
          email: "submit_rate@example.com",
          code: "123456",
          password: "Password123!",
        }),
      });
      if (res.status === 429) {
        submit429Triggered = true;
        const body = (await res.json()) as { error: string };
        if (!body.error.includes("Too many verification attempts")) {
          throw new Error(`Unexpected 429 submit code message: ${body.error}`);
        }
        break;
      }
    }
    if (!submit429Triggered) {
      throw new Error("submitCodeLimiter failed to trigger HTTP 429");
    }
    console.log("   ✔ submitCodeLimiter returned HTTP 429 at 11th request (limit=10)\n");

    console.log("==================================================");
    console.log("  🎉 All Verification & Rate-Limit Tests PASSED!  ");
    console.log("==================================================");
  } finally {
    // Cleanup
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      });
    }
    if (testEmails.length > 0) {
      await prisma.emailVerificationCode.deleteMany({
        where: { email: { in: testEmails } },
      });
    }
    await prisma.$disconnect();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
