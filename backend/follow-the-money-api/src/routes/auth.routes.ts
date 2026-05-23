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

const router = Router();

router.post("/request-register-code", requestRegisterCode);
router.post("/register-with-code", registerWithCode);
router.post("/login", login);
router.get("/me", me);

router.post("/request-email-change-code", requireAuth, requestEmailChangeCode);
router.post("/confirm-email-change", requireAuth, confirmEmailChange);

export default router;