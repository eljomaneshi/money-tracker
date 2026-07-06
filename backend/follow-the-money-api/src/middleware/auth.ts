import {NextFunction, Request, Response} from "express";
import jwt from "jsonwebtoken";
import {JWT_SECRET} from "../config";

export interface AuthRequest extends Request {
  user?: {
    userId: number;
  };
}

export function requireAuth(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET) as { userId: number };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}