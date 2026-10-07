import { Router } from "express";
import {
    requestRegisterCode,
    registerWithCode,
    login,
    me,
    requestEmailChangeCode,
    confirmEmailChange,
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import {
    loginLimiter,
    requestCodeLimiter,
    submitCodeLimiter,
} from "../middleware/rateLimiter";

const router = Router();

router.post("/request-register-code", requestCodeLimiter, requestRegisterCode);
router.post("/register-with-code", submitCodeLimiter, registerWithCode);
router.post("/login", loginLimiter, login);
router.get("/me", me);

router.post("/request-email-change-code", requireAuth, requestCodeLimiter, requestEmailChangeCode);
router.post("/confirm-email-change", requireAuth, submitCodeLimiter, confirmEmailChange);

export default router;