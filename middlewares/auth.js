import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
export const auth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(400).json({
        msg: "Login first!",
      });
    }
    const decodedData = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decodedData.token)
      .populate("followers")
      .populate("threads")
      .populate("replies")
      .populate("reposts");
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({
      msg: "Error in Auth!",
      err: err.message,
    });
  }
};
