import { User } from "../models/user.js";
import { Post } from "../models/post.js";
import { Comment } from "../models/comment.js";
import mongoose from "mongoose";

//add comment
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!id) {
      return res.status(400).json({
        msg: "Id is required!",
      });
    }
    if (!text) {
      return res.status(400).json({
        msg: "Comment cannot be empty!",
      });
    }
    const postExist = await Post.findById(id);
    if (!postExist) {
      return res.status(404).json({
        msg: "Post not found!",
      });
    }
    const comment = new Comment({
      text,
      admin: req.user._id,
      post: postExist._id,
    });
    const newComment = await comment.save();
    await Post.findByIdAndUpdate(
      id,
      {
        $push: { comments: newComment._id },
      },
      { new: true }
    );
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: { replies: newComment._id },
      },
      { new: true }
    );
    res.status(201).json({
      msg: "Added new Comment!",
    });
  } catch (err) {
    res.status(500).json({
      msg: "Error in adding comment!",
      err: err.message,
    });
  }
};

//delete comment
export const deleteComment = async (req, res) => {
  try {
    const { postId, id } = req.params;
    if (!postId || !id) {
      return res.status(400).json({
        msg: "Id is required!",
      });
    }
    const postExist = await Post.findById(postId);
    if (!postExist) {
      return res.status(404).json({
        msg: "Post not found!",
      });
    }
    const commentExist = await Comment.findById(id);
    if (!commentExist) {
      return res.status(404).json({
        msg: "Comment not found!",
      });
    }
    const newId = new mongoose.Types.ObjectId(id);
    if (postExist.comments.includes(newId)) {
      const id1 = commentExist.admin._id.toString();
      const id2 = req.user._id.toString();

      if (id1 !== id2) {
        return res.status(400).json({
          msg: "You are not authorized to delete this comment!",
        });
      }
      await Post.findByIdAndUpdate(
        postId,
        {
          $pull: { comments: id },
        },
        { new: true }
      );
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $pull: { replies: id },
        },
        { new: true }
      );

      await Comment.findByIdAndDelete(id);
      return res.status(200).json({
        msg: "Comment deleted!",
      });
    }
    res.status(400).json({
      msg: "This post does not have any comment!",
    });
  } catch (err) {
    res.status(500).json({
      msg: "Error in deleting comment!",
      err: err.message,
    });
  }
};
