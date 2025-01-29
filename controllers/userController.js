import { User } from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import formidable from "formidable";
import cloudinary from "../config/cloudinary.js";

//register user
export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({
        msg: "username,email and password are required!",
      });
    }
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({
        msg: "User already exists.Please login!",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword,
    });
    const savedUser = await user.save();
    const accessToken = jwt.sign(
      { token: savedUser._id },
      process.env.SECRET_KEY,
      { expiresIn: "30d" }
    );

    return res
      .status(201)
      .cookie("token", accessToken, {
        maxAge: 1000 * 60 * 60 * 24 * 30,
        httpOnly: true,
        sameSite: "none",
        secure: true,
      })
      .json({
        msg: `User registered successfully. Welcome ${savedUser.username}`,
      });
  } catch (err) {
    res.status(500).json({
      msg: "Error while registering,please try again later!",
      err: err.message,
    });
  }
};

//login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        msg: "email and password are required!",
      });
    }
    const userExist = await User.findOne({ email }).select("+password");
    if (!userExist) {
      return res.status(400).json({
        msg: "Email id not found,please signup!",
      });
    }
    const matchedPassword = await bcrypt.compare(password, userExist.password);
    if (!matchedPassword) {
      return res.status(404).json({
        msg: "Incorrect Credentials!",
      });
    }
    const accessToken = jwt.sign(
      { token: userExist._id },
      process.env.SECRET_KEY,
      { expiresIn: "30d" }
    );

    res
      .status(200)
      .cookie("token", accessToken, {
        maxAge: 1000 * 60 * 60 * 24 * 30,
        httpOnly: true,
        sameSite: "none",
        secure: true,
      })
      .json({
        msg: "Logged in successfully!",
      });
  } catch (err) {
    res.status(500).json({
      msg: "Error while signing in,please try again later!",
      err: err.message,
    });
  }
};

//get user details
export const userDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(404).json({
        msg: "Id is required!",
      });
    }
    const user = await User.findById(id)
      .populate("followers")
      .populate({
        path: "threads",
        populate: [{ path: "likes" }, { path: "comments" }, { path: "admin" }],
      })
      .populate({ path: "replies", populate: { path: "admin" } })
      .populate({
        path: "reposts",
        populate: [{ path: "likes" }, { path: "comments" }, { path: "admin" }],
      });

    res.status(200).json({
      msg: "user details fetched",
      user,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Unable to get details. Please try again later!",
      err: err.message,
    });
  }
};

//follow user
export const followUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        msg: "Id is required!",
      });
    }
    const user = await User.findById(id);
    if (user.followers.includes(req.user._id)) {
      await User.findByIdAndUpdate(
        user._id,
        {
          $pull: { followers: req.user._id },
        },
        { new: true }
      );
      return res.status(201).json({
        msg: `Unfollowed ${user.username}`,
      });
    }
    await User.findByIdAndUpdate(
      user._id,
      {
        $push: { followers: req.user._id },
      },
      { new: true }
    );
    return res.status(201).json({
      msg: `Followed ${user.username}`,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Error while following user! Please try again later!",
      err: err.message,
    });
  }
};

//update profile
export const updateProfile = async (req, res) => {
  try {
    const userExist = await User.findById(req.user._id);
    if (!userExist) {
      return res.status(404).json({
        msg: "User not found!",
      });
    }

    const form = formidable({});
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(400).json({
          msg: "Error in formidable!",
          err: err.message,
        });
      }
      try {
        if (fields.text) {
          await User.findByIdAndUpdate(
            req.user._id,
            { bio: fields.text },
            { new: true }
          );
        }
        if (files.media) {
          //first remove pic from cloudinary thats already there
          if (userExist.public_id) {
            await cloudinary.uploader.destroy(userExist.public_id);
          }
          const uploadedImg = await cloudinary.uploader.upload(
            files.media.filepath,
            { folder: "Threads/Profiles" }
          );

          await User.findByIdAndUpdate(
            req.user._id,
            {
              profilePic: uploadedImg.secure_url,
              public_id: uploadedImg.public_id,
            },
            { new: true }
          );
        }
        res.status(201).json({
          msg: "Profile Updated!",
        });
      } catch (updateErr) {
        res.status(500).json({
          msg: "Error during profile update!",
          err: updateErr.message,
        });
      }
    });
  } catch (err) {
    res.status(500).json({
      msg: "Error in update profile!",
      err: err.message,
    });
  }
};

//search user
export const searchUser = async (req, res) => {
  try {
    const { query } = req.params;
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    });
    res.status(200).json({
      msg: "Searched!",
      users,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Error in Searching!",
      err: err.message,
    });
  }
};

//logout
export const logout = async (req, res) => {
  try {
    res.cookie("token", "", {
      maxAge: Date.now(),
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    res.status(201).json({
      msg: "You Logged out!",
    });
  } catch (err) {
    res.status(500).json({
      msg: "Error in logout !",
      err: err.message,
    });
  }
};

//my info
export const myInfo = (req, res) => {
  try {
    res.status(200).json({
      me: req.user,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Error in my info!",
      err: err.message,
    });
  }
};
