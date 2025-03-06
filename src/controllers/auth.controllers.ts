import { Request, Response } from "express";
import { ErrorResponse, SuccessResponse } from "../helper/apiResponse.helper";
import User from "../models/user.models";
import Wallet from "../models/wallet.models";
import mongoose from "mongoose";
import jwt from 'jsonwebtoken';

// authenticate
export const authenticate = async (
  req: Request,
  res: Response
): Promise<any> => {
  // start transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // fetch data
    const { user } = req.body;

    // validation
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return ErrorResponse(res, 400, "user is required");
    }

    // check if user exists
    const isUser = await User.findOne({ email: user.email });

    // if user exists - update lastlogin
    if (isUser) {
      isUser.lastLogin = new Date();
      await isUser.save({ session });
      
      // token
      const token = jwt.sign({id:isUser?._id, email: isUser.email, role: isUser.role}, process.env.JWT_SECRET!,{ expiresIn: "7d" });


      await session.commitTransaction();
      session.endSession();
      return SuccessResponse(
        res,
        200,
        "user authenticated successfully",
        token
      );
    }

    // if user doesn't exist - create user
    const newUser = new User({
      email: user.email,
      username: user.email.split("@")[0],
      lastLogin: new Date(),
      role: "User",
      isVerified: false,
      image: user.image,
    });

    // save user
    await newUser.save({ session });

    // now create wallet
    const newWallet = new Wallet({
      user: newUser._id,
      balance: 0,
      referrelBalance: 0,
      pending: 0,
    });

    // save wallet
    await newWallet.save({ session });

    // updateUserWithWallet
    newUser.wallet = newWallet._id;
    await newUser.save({ session });

    // token
    const token = jwt.sign({id:newUser?._id, email: newUser.email, role: newUser.role}, process.env.JWT_SECRET!,{ expiresIn: "7d" });


    // commit transaction
    await session.commitTransaction();
    session.endSession();

    return SuccessResponse(res,200,"User loggedin",token);

  } catch (error) {
    console.log("authenticate internal server error", error);
    await session.abortTransaction();
    session.endSession();
    return ErrorResponse(res, 500, "authenticate internal server error");
  }
};


// 
export const getUser = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user?.id;
    console.log("userId",userId)
    const data = await User.findOne({ _id: userId });
    console.log("data",data);
    return SuccessResponse(res,200,"fetched",data);
  } catch (error) {
    console.log(error);
    return ErrorResponse(res,500,"Error in server")
  }
};
