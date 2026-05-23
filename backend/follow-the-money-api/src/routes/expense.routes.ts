import { Router } from "express";
import {requireAuth} from "../middleware/auth";
import {
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
} from "../controllers/expense.controller";

const router = Router();

router.get("/", requireAuth, getExpenses);
router.post("/", requireAuth, createExpense);
router.put("/:id", requireAuth, updateExpense);
router.delete("/:id", requireAuth, deleteExpense);

export default router;