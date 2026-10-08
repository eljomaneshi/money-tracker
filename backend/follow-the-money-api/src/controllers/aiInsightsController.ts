import { Response } from "express";
import rateLimit from "express-rate-limit";
import { AuthRequest } from "../middleware/auth";
import { computeUserAggregateMetrics } from "../services/aiSanitizer.service";

/**
 * Strict rate limiter for AI insight endpoints: 10 requests per hour per IP.
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Too many AI analysis requests. Please try again in an hour.",
  },
});

/**
 * Returns the sanitized aggregate metrics preview for the authenticated user.
 * Allows user to inspect the exact payload before opting in.
 */
export const getAggregatePreview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const metrics = await computeUserAggregateMetrics(userId);

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    return res.json({
      success: true,
      metrics,
    });
  } catch (error) {
    console.error("Failed to compute aggregate preview:", error);
    return res.status(500).json({ error: "Failed to calculate aggregate metrics" });
  }
};

/**
 * Generates an AI summary using Anthropic Claude.
 * Strictly verifies opt-in confirmation and passes ONLY sanitized numeric aggregates.
 */
export const generateInsights = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { optInConfirmed } = req.body;
    if (optInConfirmed !== true) {
      return res.status(403).json({
        error: "AI insights feature requires explicit opt-in consent.",
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(501).json({
        error: "Claude AI service is not configured. ANTHROPIC_API_KEY is not set on this server.",
        configured: false,
      });
    }

    const metrics = await computeUserAggregateMetrics(userId);

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 400,
        system:
          "You are a helpful, privacy-conscious personal finance assistant. Analyze the user's high-level spending aggregates and provide 2-3 friendly, practical, and constructive financial observations. Keep your tone encouraging and concise. Do not give formal legal or investment advice.",
        messages: [
          {
            role: "user",
            content: `Please review these anonymized high-level financial metrics for the past 30 days:\n${JSON.stringify(metrics, null, 2)}`,
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      console.error("Anthropic API error response:", errText);
      return res.status(502).json({
        error: "External AI provider returned an error. Please try again later.",
      });
    }

    const data = (await anthropicResponse.json()) as any;
    const summaryText =
      data?.content?.[0]?.text || "No insights could be generated at this time.";

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    return res.json({
      success: true,
      summary: summaryText,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to generate AI insights:", error);
    return res.status(500).json({ error: "Failed to generate AI insights" });
  }
};
