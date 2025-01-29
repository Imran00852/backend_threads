import { User } from "../models/user.js";
import { Comment } from "../models/comment.js";
import { Post } from "../models/post.js";
import cloudinary from "../config/cloudinary.js";
import formidable from "formidable";
import mongoose, { model } from "mongoose";

//add post
export const addPost = async (req, res) => {
  try {
    const form = formidable({});
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(400).json({
          msg: "Error in form parse!",
        });
      }
      const post = new Post();
      if (fields.text) {
        post.text = fields.text;
      }
      if (files.media) {
        const uploadedImg = await cloudinary.uploader.upload(
          files.media.filepath,
          {
            folder: "Threads/Posts",
          }
        );
        post.media = uploadedImg.secure_url;
        post.public_id = uploadedImg.public_id;
      }
      post.admin = req.user._id;
      const newPost = await post.save();
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $push: { threads: newPost._id },
        },
        { new: true }
      );
      res.status(201).json({
        msg: "Post created!",
        newPost,
      });
    });
  } catch (err) {
    res.status(500).json({
      msg: "Error in Add Post!",
      err: err.message,
    });
  }
};

//get all posts
export const allPosts = async (req, res) => {
  try {
    const { page } = req.query;
    let pageNumber = page;
    if (!page || page === undefined) {
      pageNumber = 1;
    }
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * 3)
      .limit(3)
      .populate("admin")
      .populate("likes")
      .populate({
        path: "comments",
        populate: {
          path: "admin",
          model: "User",
        },
      });

    res.status(200).json({
      msg: "Posts fetched!",
      posts,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Error in fetching posts !",
      err: err.message,
    });
  }
};

//delete post
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(404).json({
        msg: "Id is required!",
      });
    }
    const postExist = await Post.findById(id);
    if (!postExist) {
      return res.status(404).json({
        msg: "Post not found !",
      });
    }
    const userId = req.user._id.toString();
    const adminId = postExist.admin._id.toString();
    if (userId !== adminId) {
      return res.status(400).json({
        msg: "You're not authorized to delete this post!",
      });
    }

    if (postExist.media) {
      await cloudinary.uploader.destroy(postExist.public_id);
    }
    await Comment.deleteMany({ _id: { $in: postExist.comments } });
    await User.updateMany(
      {
        $or: [{ threads: id }, { reposts: id }, { replies: id }],
      },
      {
        $pull: {
          threads: id,
          reposts: id,
          replies: id,
        },
      },
      {
        new: true,
      }
    );
    await Post.findByIdAndDelete(id);
    res.status(200).json({
      msg: "Post deleted!",
    });
  } catch (err) {
    res.status(500).json({
      msg: "Error in deleting post!",
      err: err.message,
    });
  }
};

//like/dislike post
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(404).json({
        msg: "Id is required!",
      });
    }
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        msg: "Post not found !",
      });
    }
    if (post.likes.includes(req.user._id)) {
      await Post.findByIdAndUpdate(
        id,
        {
          $pull: { likes: req.user._id },
        },
        { new: true }
      );
      return res.status(201).json({
        msg: "you unliked this post!",
      });
    }
    await Post.findByIdAndUpdate(
      id,
      {
        $push: { likes: req.user._id },
      },
      { new: true }
    );
    res.status(201).json({
      msg: "you liked this post!",
    });
  } catch (err) {
    res.status(500).json({
      msg: "Error in like post!",
      err: err.message,
    });
  }
};

//repost
export const repost = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(404).json({
        msg: "Id is required!",
      });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        msg: "Post not found !",
      });
    }
    const newId = new mongoose.Types.ObjectId(id);
    if (req.user.reposts.includes(newId)) {
      return res.status(400).json({
        msg: "This post is already reposted!",
      });
    }
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: { reposts: post._id },
      },
      { new: true }
    );

    res.status(201).json({
      msg: "Reposted!",
    });
  } catch (err) {
    res.status(500).json({
      msg: "Error in repost!",
      err: err.message,
    });
  }
};

//get single post
export const singlePost = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(404).json({
        msg: "Id is required!",
      });
    }
    const post = await Post.findById(id)
      .populate({ path: "admin" })
      .populate({ path: "likes" })
      .populate({
        path: "comments",
        populate: {
          path: "admin",
        },
      });
    res.status(200).json({
      msg: "Post fetched!",
      post,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Error in retrieving single post!",
      err: err.msg,
    });
  }
};
