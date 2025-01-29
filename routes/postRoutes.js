import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import {
  addPost,
  allPosts,
  deletePost,
  likePost,
  repost,
  singlePost,
} from "../controllers/postController.js";

const router = Router();

router.route("/post").post(auth, addPost).get(auth, allPosts);
router
  .route("/post/:id")
  .delete(auth, deletePost)
  .put(auth, likePost)
  .get(auth, singlePost);
router.put("/repost/:id", auth, repost);

export default router;
