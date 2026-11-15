import { Request, Response, NextFunction } from "express";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error("Error:", err);

  if (err.message.startsWith("CORS blocked")) {
    return res.status(403).json({ error: err.message });
  }

  // body-parser errors (malformed JSON, payload too large, bad charset) carry a 4xx status and a type
  const { status, type } = err as { status?: unknown; type?: unknown };
  if (type && typeof status === "number" && status >= 400 && status < 500) {
    return res.status(status).json({ error: `Invalid request body: ${err.message}` });
  }

  res.status(500).json({ error: "Internal server error" });
}
