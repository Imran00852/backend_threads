import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    bio: {
      type: String,
    },
    profilePic: {
      type: String,
      default:
        "https://image.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-260nw-2281862025.jpg",
    },
    public_id: {
      type: String,
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    threads: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
