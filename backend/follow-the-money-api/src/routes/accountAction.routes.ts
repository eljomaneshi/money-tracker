import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
    getAccountActions,
    depositToAccount,
    withdrawFromAccount,
    transferBetweenAccounts,
} from "../controllers/accountAction.controller";

const router = Router();

router.get("/", requireAuth, getAccountActions);
router.post("/deposit", requireAuth, depositToAccount);
router.post("/withdraw", requireAuth, withdrawFromAccount);
router.post("/transfer", requireAuth, transferBetweenAccounts);

export default router;