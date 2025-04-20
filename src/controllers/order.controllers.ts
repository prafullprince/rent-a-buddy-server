import { Request, Response } from "express";
import { ErrorResponse, SuccessResponse } from "../helper/apiResponse.helper";
import User from "../models/user.models";
import Event from "../models/event.models";
import Chat from "../models/chat.models";
import Order from "../models/order.models";
import { chatRoom } from "../index";
import Message from "../models/message.models";

// request order
export const requestOrder = async (parsedData: any, socket:any) => {
  let senderWs: any;
  try {
    // validation
    if (
      !parsedData?.payload?.formData?.location ||
      !parsedData?.payload?.formData?.date ||
      !parsedData?.payload?.formData?.time ||
      !parsedData?.payload?.formData?.additionalInfo ||
      !parsedData?.payload?.formData?.cabFare ||
      !parsedData?.payload?.formData?.totalPrice ||
      !parsedData?.payload?.formData?.eventId ||
      !parsedData?.payload?.formData?.sender ||
      !parsedData?.payload?.formData?.receiver ||
      !parsedData?.payload?.formData?.subId ||
      !parsedData?.payload?.formData?.unit
    ) {
      throw new Error("Invalid payload structure");
    }

    // fetch data
    const { location, date, time, additionalInfo, cabFare, totalPrice, eventId, sender, receiver, subId, unit } = parsedData.payload.formData;

    // validation on event, user
    const [fromUser, toUser, isEvent] = await Promise.all([
      User.findById(sender).lean(),
      User.findById(receiver).lean(),
      Event.findById(eventId).lean(),
    ]);
    if (!fromUser || !toUser || !isEvent) {
      throw new Error("Bad request");
    }

    // amount vaildation

    // checkIsChatExists -> if not create chat
    let chat = await Chat.findOne({ participants: { $all: [sender, receiver] } });
    if (!chat) {
      chat = await Chat.create({
        participants: [sender, receiver]
      });
    }

    // create order
    const order = await Order.create({
      location,
      date,
      time,
      additionalInfo,
      cabFare,
      totalPrice,
      event: eventId,
      sender,
      receiver,
      subId: subId?._id,
      unit,
      chat: chat?._id,
    });

    // createMessage
    const message = new Message({
      sender,
      receiver,
      chatId: chat?._id,
      text: parsedData.payload.formData,
      type: "order",
    })
    await message.save();

    // update chat with the new message
    const updatedChat = await Chat.findByIdAndUpdate(
      chat?._id,
      { $push: { message: message._id } },
      { new: true }
    );

    // update chatRoom
    if (!chatRoom.get(chat?._id.toString())) {
      chatRoom.set(chat?._id.toString(), new Map());
    }

    // participants
    const participants = chatRoom.get(chat?._id.toString());
    participants?.set(sender, socket);
    participants?.set(receiver, socket);

    senderWs = participants?.get(sender);
    const receiverWs = participants?.get(receiver);

    // send message to sender
    if (senderWs?.readyState === WebSocket.OPEN) {
      senderWs.send(
        JSON.stringify({ type: "receiveMessage", payload: message })
      );
    } else {
      console.log(`Sender socket for ${sender} is not open`);
    }

    // send message to receiver
    if (receiverWs?.readyState === WebSocket.OPEN) {
      receiverWs.send(
        JSON.stringify({ type: "receiveMessage", payload: message })
      );
    } else {
      console.log(`Receiver socket for ${receiver} is not open`);
    }

    // send response to client
    senderWs?.send(
      JSON.stringify({
        type: "orderStatus",
        payload: {
          success: true,
          message: "Order request sent successfully",
          data: message
        }
      })
    )

    return;

  } catch (error) {
    console.log(error);
    // send response to client
    senderWs?.send(
      JSON.stringify({
        type: "orderStatus",
        payload: {
          success: false,
          message: "Order request failed",
        }
      })
    )
    return;
  }
};

// removeChatFromRoom
export const removeUserFromChatRoom = (chatId: string, userId: string) => {
  try {
    // fetch participants
    const participants = chatRoom.get(chatId);

    // if participants exist delete user from participants
    if (participants) {
      participants.delete(userId);
    }

    // if chatRoom is empty delete chatRoom
    if (chatRoom.size === 0) {
      chatRoom.delete(chatId);
    }
  } catch (error) {
    console.log("error", error);
  }
};

// registerUserInChatRoom
export const registerUserInChatRoom = async (
  parsedData: {
    payload: {
      chatId: string;
      userId: string;
    };
  },
  socket: any
): Promise<any> => {
  try {
    // validation
    if (!parsedData?.payload) {
      throw new Error("Invalid payload structure");
    }

    // fetch data
    const { chatId, userId } = parsedData.payload;

    // validation
    if (!chatId || !userId) {
      throw new Error("Invalid payload structure");
    }

    // chatRoom
    if (!chatRoom.get(chatId)) {
      chatRoom.set(chatId, new Map());
    }

    // participants
    const participants = chatRoom.get(chatId);
    participants?.set(userId, socket);

    // Handle disconnection
    socket.on("disconnect", () => {
      removeUserFromChatRoom(chatId, userId);
    });
  } catch (error) {
    console.log(error);
    return;
  }
};

// sendMessage
export const sendMessage = async (parsedData: any): Promise<any> => {
  try {
    // Validate payload
    if (
      !parsedData?.payload ||
      !parsedData.payload.sender ||
      !parsedData.payload.receiver ||
      !parsedData.payload.chatId ||
      !parsedData.payload.text
    ) {
      console.log("Invalid data received:", parsedData);
      return;
    }

    const { sender, receiver, chatId, text } = parsedData.payload;

    // Get chat participants
    const participants = chatRoom.get(chatId);
    if (!participants) {
      console.log("No active participants found for chatId:", chatId);
      return;
    }

    const senderSocket = participants?.get(sender);
    const receiverSocket = participants?.get(receiver);

    // Create and save message
    const message = new Message({ sender, receiver, chatId, text });
    await message.save();

    // Send message to sender
    if (senderSocket?.readyState === WebSocket.OPEN) {
      senderSocket.send(
        JSON.stringify({ type: "receiveMessage", payload: message })
      );
    } else {
      console.log(`Sender socket for ${sender} is not open`);
    }

    // Send message to receiver
    if (receiverSocket?.readyState === WebSocket.OPEN) {
      receiverSocket.send(
        JSON.stringify({ type: "receiveMessage", payload: message })
      );
    } else {
      console.log(`Receiver socket for ${receiver} is not open`);
    }
    console.log("senderSocket readyState", senderSocket?.readyState);
    console.log("receiverSocket readyState", receiverSocket?.readyState);
    console.log("websocket is open", WebSocket.OPEN);

    // Update chat with the new message
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { $push: { message: message._id } },
      { new: true }
    );

    if (!updatedChat) {
      console.log("Failed to update chat:", chatId);
    } else {
      console.log("Chat updated successfully:", updatedChat);
    }
  } catch (error) {
    console.error("Error in sendMessage:", error);
  }
};

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
    const data = await Message.find({ chatId: chatId }).lean();

    // return res
    return SuccessResponse(res, 200, "Messages fetched successfully", data);
  } catch (error) {
    console.log(error);
    return ErrorResponse(res, 500, "Internal server error");
  }
};

// fetchChat
export const fetchChat = async (req: Request, res: Response): Promise<any> => {
  try {
    // fetch data
    const userId = req.user?.id;

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

    // fetch chats
    const data = await Chat.find({ participants: userId })
      .populate({
        path: "participants",
        select: "_id username image",
      })
      .populate({
        path: "message",
        select: "_id text",
      });

    // return res
    return SuccessResponse(res, 200, "Chats fetched successfully", data);
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
