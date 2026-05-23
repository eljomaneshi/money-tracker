import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as subscriptionController from "../controllers/subscription.controller";

const router = Router();

router.get("/", requireAuth, subscriptionController.getSubscriptions);
router.post("/", requireAuth, subscriptionController.createSubscription);
router.post("/process-reminders", requireAuth, subscriptionController.processReminders);
router.post("/process-due", requireAuth, subscriptionController.processDueSubscriptions);
router.patch("/:id/cancel", requireAuth, subscriptionController.cancelSubscription);

export default router;