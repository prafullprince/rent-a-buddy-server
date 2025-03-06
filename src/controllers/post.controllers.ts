import { Request, Response } from "express";
import Post from "../models/post.models";
import { thumbnailToCloudinary } from "../helper/mediaUpload.helper";
import User from "../models/user.models";
import { ErrorResponse, SuccessResponse } from "../helper/apiResponse.helper";

// create post
export const createPost = async (req: Request, res: Response) => {
  try {
    // fetch data
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // check user present
    const isUser = await Post.findOne({ user: userId });
    if (!isUser) {
      return res.status(404).json({ message: "User not found" });
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
export const getPostsByUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // check user present
    const isUser = await Post.findOne({ user: userId });
    if (!isUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // get posts -> infinte scrolling
    const posts = await Post.find({ user: isUser._id });

    return SuccessResponse(res,200,"Posts fetched successfully",posts);

  } catch (error) {
    console.log(error);
    return ErrorResponse(res,500,"Internal Server Error");
  }
};


// delete post by id
export const deletePostById = async (req: Request, res: Response) => {
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
      Post.findOne({ user: userId}),
      User.findById(userId)
    ])

    if (!isPost) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (!isUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // delete post
    await Post.findByIdAndDelete(isPost._id);

    // update user
    await User.findByIdAndUpdate(
      { _id: isUser._id },
      {
        $pull: {
          posts: postId,
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
