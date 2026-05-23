// account.routes.ts
import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as accountController from "../controllers/account.controller";

const router = Router();

router.get("/", requireAuth, accountController.getAccounts);
router.post("/", requireAuth, accountController.createAccount);
router.patch("/:id", requireAuth, accountController.updateAccount);
router.delete("/:id", requireAuth, accountController.deleteAccount);
router.get(
    "/exchange-rates",
    requireAuth,
    accountController.getExchangeRates
);

export default router;