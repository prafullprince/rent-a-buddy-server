import { Request, Response } from "express";
import { ErrorResponse, SuccessResponse } from "../helper/apiResponse.helper";
import User from "../models/user.models";
import Event from "../models/event.models";
import Chat from "../models/chat.models";
import Order from "../models/order.models";
import { chatRoom } from "../index";
import Message from "../models/message.models";

// fetchUserChats
export const fetchUserChats = async (parsedData: any, socket: any) => {
  try {
    // validation
    if (!parsedData?.payload) {
      throw new Error("Invalid payload structure");
    }

    // fetch data
    const { userId } = parsedData.payload;

    // validation
    if (!userId) {
      throw new Error("userId is required");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // fetch chats
    const chats = await Chat.find({ participants: userId })
      .populate({
        path: "participants",
        select: "_id username image",
      })
      .populate({
        path: "message",
        select: "_id text isSeen receiver",
      });
    console.log("first", chats);
    // send message to client
    socket.send(
      JSON.stringify({
        type: "fetchUserAllChats",
        payload: {
          success: true,
          message: "User chats fetched successfully",
          data: chats,
        },
      })
    );
    return;
  } catch (error) {
    console.log(error);
    return;
  }
};

// unseenMessages
export const unseenMessages = async (parsedData: any, socket: any) => {
  try {
    // validation
    if (!parsedData?.payload) {
      throw new Error("Invalid payload structure");
    }
    console.log("parsedData", parsedData);

    // fetch data
    const { userId } = parsedData.payload;

    // validation
    if (!userId) {
      throw new Error("userId is required");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // find allmessage of user and update isSeen to true of receiver
    const messages = await Message.find({ receiver: userId, isSeen: false });

    // send message length to client
    socket.send(
      JSON.stringify({
        type: "numOfUnseenMessages",
        payload: {
          totalMessages: messages.length,
        },
      })
    );

    return;
  } catch (error) {
    console.log(error);
    return;
  }
};

// markAsRead
export const markAsRead = async (parsedData: any, socket: any) => {
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

    // find allmessage of chat and update isSeen to true of receiver
    const messages = await Message.find({ chatId: chatId, receiver: userId });
    if (messages.length > 0) {
      await Message.updateMany(
        { chatId: chatId, receiver: userId },
        { $set: { isSeen: true } }
      );
    }
    return;
  } catch (error) {
    console.log(error);
    return;
  }
};

// request order
export const requestOrder = async (parsedData: any, socket: any) => {
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
    const {
      location,
      date,
      time,
      additionalInfo,
      cabFare,
      totalPrice,
      eventId,
      sender,
      receiver,
      subId,
      unit,
    } = parsedData.payload.formData;
    console.log("first", parsedData.payload.formData);

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
    let chat = await Chat.findOne({
      participants: { $all: [sender, receiver] },
    });
    if (!chat) {
      chat = await Chat.create({
        participants: [sender, receiver],
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
      order: order._id,
    });
    await message.save();

    // update chat with the new message
    await Chat.findByIdAndUpdate(
      chat?._id,
      { $push: { message: message._id } },
      { new: true }
    );

    // update chatRoom
    if(!chatRoom?.get(chat?._id?.toString())){
      chatRoom?.set(chat?._id?.toString(), new Map());
    }

    let participants = chatRoom.get(chat?._id.toString());
    if (!participants) {
      participants = new Map();
      participants.set(sender, socket);
    } else {
      if (!participants.has(sender)) {
        participants.set(sender, socket);
      }
    }

    senderWs = participants?.get(sender);
    const receiverWs = participants?.get(receiver);
    console.log("senderWs", senderWs?.readyState);
    console.log("receiverWs", receiverWs?.readyState);
    console.log("message", message);

    // send message to sender
    if (senderWs && senderWs?.readyState === WebSocket.OPEN) {
      senderWs?.send(
        JSON.stringify({ type: "receiveMessage", payload: message })
      );
    } else {
      console.log(`Sender socket for ${sender} is not open`);
    }

    // send message to receiver
    if (receiverWs && receiverWs?.readyState === WebSocket.OPEN) {
      receiverWs.send(
        JSON.stringify({ type: "receiveMessage", payload: message })
      );
    } else {
      console.log(`Receiver socket for ${receiver} is not open`);
    }

    if(receiverWs && receiverWs?.readyState === WebSocket.OPEN){
      receiverWs?.send(
        JSON.stringify({
          type: "fetchUserAllChats",
          payload: {
            success: true,
            message: "User chats fetched successfully",
            data: chat,
          },
        })
      );
    }

    // reload chat
    if(receiverWs && receiverWs?.readyState === WebSocket.OPEN){
      receiverWs?.send(
        JSON.stringify({
          type: "reloadChat",
          payload: {
            success: true,
            message: "Chat reloaded successfully",
            chatId: chat?._id,
          },
        })
      );
    }

    // send response to client
    if(senderWs && senderWs?.readyState === WebSocket.OPEN){
      senderWs?.send(
        JSON.stringify({
          type: "orderStatus",
          payload: {
            success: true,
            message: "Order request sent successfully",
            data: message,
          },
        })
      );
    }

    return;
  } catch (error) {
    console.log(error);
    // send response to client
    // senderWs?.send(
    //   JSON.stringify({
    //     type: "orderStatus",
    //     payload: {
    //       success: false,
    //       message: "Order request failed",
    //     },
    //   })
    // );
    throw new Error("Order request failed");
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
    console.log("senderSocket", senderSocket);
    console.log("receiverSocket", receiverSocket);

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
        select: "_id text isSeen receiver",
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

// acceptOrder
export const acceptOrder = async (parsedData: any, socket: any) => {
  try {
    // validation
    if (!parsedData?.payload?.msgId) {
      throw new Error("Invalid payload structure");
    }

    // fetch data
    const { msgId, mark } = parsedData.payload;

    // validation
    if (!msgId) {
      throw new Error("Invalid payload structure");
    }

    // fetch message
    const message = await Message.findById(msgId);

    // validation
    if (!message) {
      throw new Error("Message not found");
    }

    // fetch order
    const order = await Order.findById(message?.order);

    // validation
    if (!order) {
      throw new Error("Order not found");
    }

    // update order
    await Order.findByIdAndUpdate(
      order?._id,
      {
        $set: {
          status: mark,
        },
      },
      { new: true }
    );

    // update message
    await Message.findByIdAndUpdate(
      message?._id,
      {
        $set: {
          isSeen: true,
        },
      },
      { new: true }
    );

    if (!chatRoom.get(message?.chatId?.toString())) {
      chatRoom.set(message?.chatId?.toString(), new Map());
    }

    const participants = chatRoom.get(message?.chatId?.toString());

    participants?.set(message?.sender?.toString(), socket);
    participants?.set(message?.receiver?.toString(), socket);

    const senderWs = participants?.get(message?.sender?.toString());
    const receiverWs = participants?.get(message?.receiver?.toString());

    // send response to client
    senderWs?.send(
      JSON.stringify({
        type: "orderAccepted",
        payload: {
          success: true,
          message: "Your Order accepted, please do payment",
        },
      })
    );

    // send response to receiver
    receiverWs?.send(
      JSON.stringify({
        type: "orderAccepted",
        payload: {
          success: true,
          message: "Order accepted successfully",
        },
      })
    );
  } catch (error) {
    console.log(error);
    // send response to client
    // senderWs?.send(
    //   JSON.stringify({
    //     type: "orderStatus",
    //     payload: {
    //       success: false,
    //       message: "Order request failed",
    //     }
    //   })
    // )
    return;
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

// sendOtp
exports.sendOtp = async (req: Request, res: Response): Promise<any> => {
  try {
    // fetch data
  } catch (error) {
    console.log(error);
    return ErrorResponse(res, 500, "Internal server error");
  }
};

// verify otp
exports.verifyOtp = async (req: Request, res: Response): Promise<any> => {
  try {
    // fetch data
  } catch (error) {
    console.log(error);
    return ErrorResponse(res, 500, "Internal server error");
  }
};
