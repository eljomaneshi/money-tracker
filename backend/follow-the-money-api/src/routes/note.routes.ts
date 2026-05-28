import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
    getNotes,
    createNote,
    updateNote,
    deleteNote,
} from "../controllers/note.controller";

const router = Router();

router.get("/", requireAuth, getNotes);
router.post("/", requireAuth, createNote);
router.put("/:id", requireAuth, updateNote);
router.delete("/:id", requireAuth, deleteNote);

export default router;