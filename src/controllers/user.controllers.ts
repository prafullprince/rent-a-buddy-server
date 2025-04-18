import { Request, Response } from "express";
import fileUpload from "express-fileupload";
import { ErrorResponse, SuccessResponse } from "../helper/apiResponse.helper";
import User from "../models/user.models";
import { thumbnailToCloudinary } from "../helper/mediaUpload.helper";


// updateProfilePicture
export const updateProfilePicture = async (req: Request, res: Response):Promise<any> => {
  try {
    // fetch data
    const userId = req.user?.id;
    const thumbnail = req.files?.thumbnail as fileUpload.UploadedFile;

    // validation
    if (!userId || !thumbnail) {
      return ErrorResponse(res, 400, "All fields are required");
    }

    // check if user exist
    const isUser = await User.findOne({ _id: userId });
    if (!isUser) {
      return ErrorResponse(res, 404, "User not found");
    }

    // upload thumbnail
    const thumbnailImage = await thumbnailToCloudinary(
      thumbnail,
      process.env.FOLDER_NAME
    );
    if (!thumbnailImage) {
      return ErrorResponse(res, 404, "upload failed");
    }

    // update profile picture
    isUser.image = thumbnailImage.secure_url;
    const data = await isUser.save();

    // return res
    return SuccessResponse(
      res,
      200,
      "Profile picture updated successfully",
      data
    );
  } catch (error) {
    console.log(error);
    return ErrorResponse(res, 500, "Internal server error");
  }
};


// aadhaar verification


// updateProfile
export const updateProfile = async (req: Request, res: Response): Promise<any> => {
  try {
    // fetch data
    const userId = req.user?.id;
    const updates = req.body;

    // validation
    if (!userId) {
      return ErrorResponse(res, 400, "All fields are required");
    }

    // check if user exist
    const isUser:any = await User.findOne({ _id: userId });
    if (!isUser) {
      return ErrorResponse(res, 404, "User not found");
    }

    // update user
    for(const key in updates){
        if(updates.hasOwnProperty(key)){
            isUser[key] = updates[key];
        }
    }

    const data = await isUser.save();

    return SuccessResponse(res,200,"Profile updated",data);

  } catch (error) {
    console.log(error);
    return ErrorResponse(res, 500, "Internal server error");
  }
};


// userDetailsById
export const userDetailsById = async (req: Request, res: Response): Promise<any> => {
  try {
    // fetch data
    const userId = req.user?.id;

    // validation
    if (!userId) {
      return ErrorResponse(res, 400, "All fields are required");
    }

    // fetch user
    const user = await User.findById(userId)
      .select("_id username image phoneNumber")
    ;

    // return res
    return SuccessResponse(res, 200, "User fetched successfully", user);
  } catch (error) {
    console.log(error);
    return ErrorResponse(res, 500, "Internal server error");
  }
};
