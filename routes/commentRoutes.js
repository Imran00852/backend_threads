import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import { addComment, deleteComment } from "../controllers/commentController.js";

const router = Router();

router.post("/comment/:id", auth, addComment);
router.delete("/comment/:postId/:id", auth, deleteComment);

export default router;
