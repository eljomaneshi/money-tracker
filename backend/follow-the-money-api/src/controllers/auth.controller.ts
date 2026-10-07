import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto, { randomInt } from "node:crypto";
import prisma from "../prisma";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config";
import { sendVerificationCodeEmail } from "../lib/mailer";
import { AuthRequest } from "../middleware/auth";

function generateVerificationCode() {
  return randomInt(100000, 1000000).toString();
}

function hashVerificationCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

interface FailedAttemptRow {
  id: number;
  failedAttempts: number;
  used: boolean;
}

async function recordFailedRegistrationCodeAttempt(id: number): Promise<FailedAttemptRow | null> {
  const rows = await prisma.$queryRaw<FailedAttemptRow[]>`
    UPDATE "EmailVerificationCode"
    SET
      "failedAttempts" = "failedAttempts" + 1,
      "used" = CASE WHEN "failedAttempts" + 1 >= 5 THEN true ELSE false END
    WHERE "id" = ${id}
      AND "used" = false
      AND "expiresAt" > NOW()
      AND "failedAttempts" < 5
    RETURNING "id", "failedAttempts", "used"
  `;
  return rows[0] ?? null;
}

async function recordFailedEmailChangeAttempt(id: number): Promise<FailedAttemptRow | null> {
  const rows = await prisma.$queryRaw<FailedAttemptRow[]>`
    UPDATE "PendingEmailChange"
    SET
      "failedAttempts" = "failedAttempts" + 1,
      "used" = CASE WHEN "failedAttempts" + 1 >= 5 THEN true ELSE false END
    WHERE "id" = ${id}
      AND "used" = false
      AND "expiresAt" > NOW()
      AND "failedAttempts" < 5
    RETURNING "id", "failedAttempts", "used"
  `;
  return rows[0] ?? null;
}

export async function requestRegisterCode(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return res.json({ message: "Verification code sent" });
    }

    const code = generateVerificationCode();
    const codeHash = hashVerificationCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.emailVerificationCode.updateMany({
      where: {
        email: normalizedEmail,
        used: false,
      },
      data: {
        used: true,
      },
    });

    await prisma.emailVerificationCode.create({
      data: {
        email: normalizedEmail,
        codeHash,
        expiresAt,
      },
    });

    await sendVerificationCodeEmail(normalizedEmail, code);

    return res.json({ message: "Verification code sent" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to send verification code" });
  }
}

export async function registerWithCode(req: Request, res: Response) {
  try {
    const { fullName, email, code, password } = req.body;

    if (!fullName || !email || !code || !password) {
      return res.status(400).json({ error: "Full name, email, code and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedFullName = String(fullName).trim();

    if (!normalizedFullName) {
      return res.status(400).json({ error: "Full name is required" });
    }

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return res.status(400).json({ error: "Email already used" });
    }

    const verification = await prisma.emailVerificationCode.findFirst({
      where: {
        email: normalizedEmail,
        used: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!verification) {
      return res.status(400).json({ error: "Verification code not found" });
    }

    if (verification.expiresAt < new Date()) {
      return res.status(400).json({ error: "Verification code expired" });
    }

    if (verification.failedAttempts >= 5) {
      return res.status(400).json({
        error: "Too many failed attempts. This verification code has been invalidated. Please request a new code.",
      });
    }

    const codeHash = hashVerificationCode(code);

    if (codeHash !== verification.codeHash) {
      const attempt = await recordFailedRegistrationCodeAttempt(verification.id);
      if (!attempt || attempt.failedAttempts >= 5) {
        return res.status(400).json({
          error: "Too many failed attempts. This verification code has been invalidated. Please request a new code.",
        });
      }

      const remaining = 5 - attempt.failedAttempts;
      return res.status(400).json({
        error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
      });
    }

    const consumption = await prisma.emailVerificationCode.updateMany({
      where: {
        id: verification.id,
        used: false,
        expiresAt: { gt: new Date() },
        failedAttempts: { lt: 5 },
      },
      data: {
        used: true,
      },
    });

    if (consumption.count === 0) {
      return res.status(400).json({
        error: "Verification code is no longer valid, has expired, or reached maximum attempts.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName: normalizedFullName,
        email: normalizedEmail,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to register user" });
  }
}

export async function requestEmailChangeCode(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { newEmail } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!newEmail) {
      return res.status(400).json({ error: "New email is required" });
    }

    const normalizedEmail = String(newEmail).trim().toLowerCase();

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (normalizedEmail === currentUser.email.toLowerCase()) {
      return res.status(400).json({ error: "New email must be different" });
    }

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return res.status(400).json({ error: "Email already used" });
    }

    const code = generateVerificationCode();
    const codeHash = hashVerificationCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.pendingEmailChange.updateMany({
      where: {
        userId,
        used: false,
      },
      data: {
        used: true,
      },
    });

    await prisma.pendingEmailChange.create({
      data: {
        userId,
        newEmail: normalizedEmail,
        codeHash,
        expiresAt,
      },
    });

    await sendVerificationCodeEmail(normalizedEmail, code);

    return res.json({ message: "Verification code sent" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to send verification code" });
  }
}

export async function confirmEmailChange(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { newEmail, code } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!newEmail || !code) {
      return res.status(400).json({ error: "New email and code are required" });
    }

    const normalizedEmail = String(newEmail).trim().toLowerCase();

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing && existing.id !== userId) {
      return res.status(400).json({ error: "Email already used" });
    }

    const pendingChange = await prisma.pendingEmailChange.findFirst({
      where: {
        userId,
        newEmail: normalizedEmail,
        used: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!pendingChange) {
      return res.status(400).json({ error: "Verification code not found" });
    }

    if (pendingChange.expiresAt < new Date()) {
      return res.status(400).json({ error: "Verification code expired" });
    }

    if (pendingChange.failedAttempts >= 5) {
      return res.status(400).json({
        error: "Too many failed attempts. This verification code has been invalidated. Please request a new code.",
      });
    }

    const codeHash = hashVerificationCode(code);

    if (codeHash !== pendingChange.codeHash) {
      const attempt = await recordFailedEmailChangeAttempt(pendingChange.id);
      if (!attempt || attempt.failedAttempts >= 5) {
        return res.status(400).json({
          error: "Too many failed attempts. This verification code has been invalidated. Please request a new code.",
        });
      }

      const remaining = 5 - attempt.failedAttempts;
      return res.status(400).json({
        error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
      });
    }

    const consumption = await prisma.pendingEmailChange.updateMany({
      where: {
        id: pendingChange.id,
        used: false,
        expiresAt: { gt: new Date() },
        failedAttempts: { lt: 5 },
      },
      data: {
        used: true,
      },
    });

    if (consumption.count === 0) {
      return res.status(400).json({
        error: "Verification code is no longer valid, has expired, or reached maximum attempts.",
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        email: normalizedEmail,
      },
    });

    return res.json({
      message: "Email updated successfully",
      user: {
        id: currentUser.id,
        email: normalizedEmail,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update email" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);

    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to login" });
  }
}

export async function me(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "Missing token" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ error: "Invalid token" });
  }
}