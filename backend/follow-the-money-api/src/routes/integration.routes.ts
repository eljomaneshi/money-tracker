import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  quickExpenseWebhook,
  getApiKey,
  generateApiKey,
  revokeApiKey,
} from "../controllers/integration.controller";

const router = Router();

// Public webhook endpoint authenticated via API Key (X-API-Key or Bearer token)
router.post("/quick-expense", quickExpenseWebhook);

// User-facing API key management (authenticated via web session JWT)
router.get("/api-key", requireAuth, getApiKey);
router.post("/api-key/generate", requireAuth, generateApiKey);
router.delete("/api-key", requireAuth, revokeApiKey);

export default router;
