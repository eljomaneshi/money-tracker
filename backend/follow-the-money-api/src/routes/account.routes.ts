import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as accountController from "../controllers/account.controller";

const router = Router();

router.get("/", requireAuth, accountController.getAccounts);
router.get("/exchange-rates", requireAuth, accountController.getExchangeRates);
router.post("/", requireAuth, accountController.createAccount);
router.patch("/:id", requireAuth, accountController.updateAccount);
router.delete("/:id", requireAuth, accountController.deleteAccount);

export default router;