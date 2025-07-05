import { Request, Response } from "express";
import { ErrorResponse, SuccessResponse } from "../helper/apiResponse.helper";
import User from "../models/user.models";
import Chat from "../models/chat.models";
import Order from "../models/order.models";
import { chatRoom, userMap } from "../index";
import Message from "../models/message.models";


// fetchAllMessages
export const fetchAllMessages = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    // fetch data
    const { chatId } = req.body;

    // validation
    if (!chatId) {
      return ErrorResponse(res, 400, "All fields are required");
    }

    // fetch chat
    const chat = await Chat.findById(chatId);

    // validation
    if (!chat) {
      return ErrorResponse(res, 404, "Chat not found");
    }

    // fetch messages
    const data = await Message.find({ chatId: chatId })
      .populate("order")
      .lean();

    // return res
    return SuccessResponse(res, 200, "Messages fetched successfully", data);
  } catch (error) {
    console.log(error);
    return ErrorResponse(res, 500, "Internal server error");
  }
};

// fetchOrderHistory -> TODO
export const fetchOrderHistory = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    // fetch data
    const { userId } = req.body;

    // validation
    if (!userId) {
      return ErrorResponse(res, 400, "All fields are required");
    }

    // fetch user
    const user = await User.findById(userId);

    // validation
    if (!user) {
      return ErrorResponse(res, 404, "User not found");
    }

    // fetch orders
    const data = await Order.find({ sender: userId });

    // return res
    return SuccessResponse(res, 200, "Orders fetched successfully", data);
  } catch (error) {
    console.log(error);
    return ErrorResponse(res, 500, "Internal server error");
  }
};

// fetchOtherUser
export const fetchOtherUser = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    // fetch data
    const { userId } = req.body;

    // validation
    if (!userId) {
      return ErrorResponse(res, 400, "All fields are required");
    }

    // fetch user
    const data = await User.findById(userId).select("_id username image");

    // return res
    return SuccessResponse(res, 200, "User fetched successfully", data);
  } catch (error) {
    console.log(error);
    return ErrorResponse(res, 500, "Internal server error");
  }
};

// fetch order of particular chat
export const fetchOrdersOfChat = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    // fetch data
    const { chatId } = req.body;

    // validation
    if (!chatId) {
      return ErrorResponse(res, 400, "All fields are required");
    }

    // fetch chat
    const chat = await Chat.findById(chatId);

    // validation
    if (!chat) {
      return ErrorResponse(res, 404, "Chat not found");
    }

    // fetch orders
    const data = await Order.find({ chat: chatId });

    // return res
    return SuccessResponse(res, 200, "Orders fetched successfully", data);
  } catch (error) {
    console.log(error);
    return ErrorResponse(res, 500, "Internal server error");
  }
};

