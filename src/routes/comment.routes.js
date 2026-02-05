import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addComment,
  updateComment,
  deleteComment,
  getVideoComments,
} from "../controllers/comment.controller.js";

const router = Router();

router.get("/:videoId", getVideoComments);
router.post("/:videoId", verifyJWT, addComment);
router.patch("/:commentId", verifyJWT, updateComment);
router.delete("/:commentId", verifyJWT, deleteComment);

export default router;
