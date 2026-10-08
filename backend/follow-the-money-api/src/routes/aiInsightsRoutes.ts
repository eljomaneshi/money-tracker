import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getAggregatePreview,
  generateInsights,
  aiLimiter,
} from "../controllers/aiInsightsController";

const router = Router();

// Endpoint paths matching /users/me/ai-insights mounting or direct /me/ai-insights mounting
router.get("/preview", requireAuth, aiLimiter, getAggregatePreview);
router.post("/generate", requireAuth, aiLimiter, generateInsights);

router.get("/me/ai-insights/preview", requireAuth, aiLimiter, getAggregatePreview);
router.post("/me/ai-insights/generate", requireAuth, aiLimiter, generateInsights);

export default router;
