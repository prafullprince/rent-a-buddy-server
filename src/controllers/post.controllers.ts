import { Request, Response } from "express";
import Post from "../models/post.models";
import { thumbnailToCloudinary } from "../helper/mediaUpload.helper";
import User from "../models/user.models";
import { ErrorResponse, SuccessResponse } from "../helper/apiResponse.helper";
import mongoose from "mongoose";

// create post
export const createPost = async (req: Request, res: Response): Promise<any> => {
  try {
    // fetch data
    const userId = req.user?.id;
    const userIds = new mongoose.Types.ObjectId(userId);
    console.log(userIds);
    if (!userIds) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // check user present
    const isUser = await User.findById(userIds);
    if (!isUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (isUser.posts.length >= 10) {
      return res.status(400).json({ message: "You can not create more than 10 posts" });
    }

    // find thumbnail
    const thumbnail = req.files?.imageUrl;
    if (!thumbnail) {
      return res.status(400).json({ message: "Thumbnail not found" });
    }

    // upload on cloudinary
    const thumbnailImage = await thumbnailToCloudinary(
      thumbnail,
      process.env.FOLDER_NAME
    );
    if (!thumbnailImage) {
      return res.status(400).json({ message: "Thumbnail not uploaded" });
    }

    // create post
    const data = await Post.create({
      user: userId,
      imageUrl: thumbnailImage.secure_url,
    });

    // update user
    await User.findByIdAndUpdate(
      { _id: isUser._id },
      {
        $push: {
          posts: data._id,
        },
      },
      { new: true }
    );

    return SuccessResponse(res,201,"Post created successfully",data);

  } catch (error) {
    console.log(error);
    return ErrorResponse(res,500,"Internal Server Error");
  }
};


// get posts by user
export const getPostsByUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.body.userId;
    const userIds = new mongoose.Types.ObjectId(userId);
    if (!userIds) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // check user present
    const isUser = await User.findById(userIds);
    if (!isUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // get posts -> max 10 posts
    const data = await User.findById(userId).select("_id posts").populate("posts").limit(10);

    return SuccessResponse(res,200,"Posts fetched successfully",data);

  } catch (error) {
    console.log(error);
    return ErrorResponse(res,500,"Internal Server Error");
  }
};


// delete post by id
export const deletePostById = async (req: Request, res: Response): Promise<any> => {
  try {

    // fetch data
    const userId = req.user?.id;
    const postId = req.body.postId;

    // validation
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!postId) {
      return res.status(400).json({ message: "Post id not found" });
    }

    // verify post exist by this user
    const [isPost,isUser] = await Promise.all([
      Post.findById(postId),
      User.findById(userId)
    ])

    if (!isPost) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (!isUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // delete post
    const data = await Post.findByIdAndDelete(isPost._id);

    // update user
    await User.findByIdAndUpdate(
      { _id: isUser._id },
      {
        $pull: {
          posts: data?._id,
        },
      },
      { new: true }
    );

    return SuccessResponse(res,200,"Post deleted successfully",null);

  } catch (error) {
    console.log(error);
    return ErrorResponse(res,500,"Internal Server Error");
  }
};
