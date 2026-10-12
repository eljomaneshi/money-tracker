import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  quickExpenseWebhook,
  getApiKey,
  generateApiKey,
  revokeApiKey,
  getIntegrationSettings,
  updateIntegrationSettings,
} from "../controllers/integration.controller";

const router = Router();

// Public webhook endpoint authenticated via API Key (X-API-Key or Bearer token)
router.post("/quick-expense", quickExpenseWebhook);

// User-facing API key & multi-card settings management (authenticated via web session JWT)
router.get("/api-key", requireAuth, getApiKey);
router.post("/api-key/generate", requireAuth, generateApiKey);
router.delete("/api-key", requireAuth, revokeApiKey);

router.get("/settings", requireAuth, getIntegrationSettings);
router.put("/settings", requireAuth, updateIntegrationSettings);

export default router;
