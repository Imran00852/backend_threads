import { Router } from "express";
import {
  signup,
  login,
  userDetails,
  followUser,
  updateProfile,
  searchUser,
  logout,
  myInfo,
} from "../controllers/userController.js";
import { auth } from "../middlewares/auth.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/user/:id", auth, userDetails);
router.put("/user/follow/:id", auth, followUser);
router.put("/update", auth, updateProfile);
router.get("/users/search/:query", auth, searchUser);
router.post("/logout", auth, logout);
router.get("/me", auth, myInfo);

export default router;
