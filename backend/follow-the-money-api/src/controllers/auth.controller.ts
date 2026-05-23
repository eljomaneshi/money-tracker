import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../prisma";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config";
import { sendVerificationCodeEmail } from "../lib/mailer";
import { AuthRequest } from "../middleware/auth";

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashVerificationCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function requestRegisterCode(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(400).json({ error: "Email already used" });
    }

    const code = generateVerificationCode();
    const codeHash = hashVerificationCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.emailVerificationCode.updateMany({
      where: {
        email,
        used: false,
      },
      data: {
        used: true,
      },
    });

    await prisma.emailVerificationCode.create({
      data: {
        email,
        codeHash,
        expiresAt,
      },
    });

    await sendVerificationCodeEmail(email, code);

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

    const codeHash = hashVerificationCode(code);

    if (codeHash !== verification.codeHash) {
      return res.status(400).json({ error: "Invalid verification code" });
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

    await prisma.emailVerificationCode.update({
      where: {
        id: verification.id,
      },
      data: {
        used: true,
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

    const codeHash = hashVerificationCode(code);

    if (codeHash !== pendingChange.codeHash) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          email: normalizedEmail,
        },
      }),
      prisma.pendingEmailChange.update({
        where: { id: pendingChange.id },
        data: {
          used: true,
        },
      }),
    ]);

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