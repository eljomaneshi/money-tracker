import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { exportLimiter } from "../middleware/rateLimiter";
import {
    getMySettings,
    updateProfile,
    updatePassword,
    updatePreferences,
    updateNotifications,
    requestEmailChangeCode,
    confirmEmailChange,
    deleteMyAccount,
    exportUserData,
} from "../controllers/userController";

const router = Router();

router.get("/me/settings", requireAuth, getMySettings);
router.get("/me/export", requireAuth, exportLimiter, exportUserData);
router.patch("/me/profile", requireAuth, updateProfile);
router.patch("/me/password", requireAuth, updatePassword);
router.patch("/me/preferences", requireAuth, updatePreferences);
router.patch("/me/notifications", requireAuth, updateNotifications);
router.post("/me/request-email-change-code", requireAuth, requestEmailChangeCode);
router.post("/me/confirm-email-change", requireAuth, confirmEmailChange);
router.delete("/me", requireAuth, deleteMyAccount);

export default router;