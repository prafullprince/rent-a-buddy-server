import { Request, Response } from "express";
import { ErrorResponse, SuccessResponse } from "../helper/apiResponse.helper";
import User from "../models/user.models";
import Event from "../models/event.models";
import Chat from "../models/chat.models";
import Order from "../models/order.models";
import { chatRoom, userMap } from "../index";
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
      .select("_id participants")
      .populate({
        path: "participants",
        select: "_id username image",
      })
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
    // TODO: decrease payload
    const messages = await Message.find({ receiver: userId, isSeen: false });

    // send message length to client
    if(socket.readyState === WebSocket.OPEN){
      socket.send(
        JSON.stringify({
          type: "numOfUnseenMessages",
          payload: {
            totalMessages: messages?.length,
          },
        })
      );
    }

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
    const { chatId, userId, receiverId } = parsedData.payload;

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

    // find allmessage of chat and update isSeen to true of sender message
    const messages = await Message.find({ chatId: chatId, receiver: receiverId });
    if (messages.length > 0) {
      await Message.updateMany(
        { chatId: chatId, receiver: receiverId },
        { $set: { isSeen: true } }
      );
    }

    // // if sender is live mark their message as seen
    // const senderSocket = participants?.get(receiverId);
    // if(senderSocket && senderSocket?.readyState === WebSocket.OPEN){
    //   senderSocket.send(
    //     JSON.stringify({ type: "markAsReadYourMessage" })
    //   );
    // }

    return;
  } catch (error) {
    console.log(error);
    return;
  }
};

// unseenMessageOfParticularChatIdOfUser
export const unseenMessageOfParticularChatIdOfUser = async ( parsedData: any, socket: any ) => {
  try {
    // validation
    if (!parsedData?.payload) {
      throw new Error("Invalid payload structure");
    }

    // fetch data
    const { userId, chatIds } = parsedData.payload;

    // validation
    if (!userId || !chatIds || chatIds.length === 0) {
      throw new Error("Invalid payload structure");
    }

    // find allmessage of chat and update isSeen to true of receiver
    const counts = await Promise.all(
      chatIds.map(
        async (chatId:any) => {
          const count = await Message.countDocuments({
            chatId: chatId,
            receiver: userId,
            isSeen: false,
          });
          return { chatId, unSeenCount:count };
        }
      )
    )

    if (counts.length > 0) {
      socket?.send(
        JSON.stringify({
          type: "numOfUnseenMessages",
          payload: counts
        })
      )
    }

    return;
  } catch (error) {
    console.log(error);
    return;
  }
};

// request order
export const requestOrder = async (parsedData: any, socket: any) => {
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
    if (!chatRoom?.has(chat?._id?.toString())) {
      chatRoom?.set(chat?._id?.toString(), new Map());
    }
    
    let participants = chatRoom.get(chat?._id?.toString());
    
    if (participants) {
      const senderId = message?.sender?.toString();
      const existingSocket = participants.get(senderId);
    
      if (!existingSocket || existingSocket.readyState !== WebSocket.OPEN) {
        participants.set(senderId, socket);
      }
    }
    
    const senderWs = participants?.get(message?.sender?.toString());
    const receiverWs = participants?.get(message?.receiver?.toString());
    
    console.log("senderWs", senderWs?.readyState);
    console.log("open websocket", WebSocket.OPEN);
    console.log("receiverWs", receiverWs?.readyState);

    // // send message to sender
    // if (senderWs && senderWs?.readyState === WebSocket.OPEN) {
    //   senderWs?.send(
    //     JSON.stringify({ type: "receiveMessage", payload: message })
    //   );
    // } else {
    //   console.log(`Sender socket for ${sender} is not open`);
    // }

    // send message to receiver
    if (receiverWs && receiverWs?.readyState === WebSocket.OPEN) {
      receiverWs.send(
        JSON.stringify({ type: "receiveMessage", payload: message })
      );
    } else {
      console.log(`Receiver socket for ${receiver} is not open`);
    }

    // if(receiverWs && receiverWs?.readyState === WebSocket.OPEN){
    //   receiverWs?.send(
    //     JSON.stringify({
    //       type: "fetchUserAllChats",
    //       payload: {
    //         success: true,
    //         message: "User chats fetched successfully",
    //         data: chat,
    //       },
    //     })
    //   );
    // }

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
    console.log("error", error);
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
): Promise<void> => {
  try {
    const { payload } = parsedData;
    const { chatId, userId } = payload || {};

    // Simple and clear validation
    if (!chatId || !userId) {
      throw new Error("chatId and userId are required");
    }

    // Initialize chat room if it doesn't exist
    if (!chatRoom.has(chatId)) {
      chatRoom.set(chatId, new Map());
    }

    // Add or update participant socket
    const participants = chatRoom.get(chatId)!;

    participants.set(userId, socket); // Always update to ensure the latest socket

    // Handle disconnection
    socket.on("disconnect", () => {
      removeUserFromChatRoom(chatId, userId);
    });

    console.log(`User ${userId} registered in chat room ${chatId}`);
  } catch (error) {
    console.error("Error in registerUserInChatRoom:", error);
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
    console.log("senderSocket", senderSocket?.readyState);
    console.log("receiverSocket", receiverSocket?.readyState);

    const isReceiverOnline = receiverSocket?.readyState === WebSocket.OPEN;
    const isChatOpen = userMap?.get(receiver) === chatId;
    console.log("isReceiverOnline", isReceiverOnline);
    console.log("isChatOpen", isChatOpen);

    // Create and save message
    const message = new Message({ sender, receiver, chatId, text, isSeen: isReceiverOnline && isChatOpen });
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
    if (isReceiverOnline) {
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

    // participants?.set(message?.sender?.toString(), socket);
    // participants?.set(message?.receiver?.toString(), socket);

    if(!participants){
      return;
    }

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

export const reloadChatPage = async (parsedData: any, socket: any) => {
  try {
    // validation
    if (!parsedData?.payload) {
      throw new Error("Invalid payload structure");
    }

    // fetch data
    const { receiverId, chatId } = parsedData.payload;
    console.log("receiverId::::", receiverId);
    // validation
    if (!receiverId) {
      throw new Error("Invalid receiverId");
    }

    // fetch chat
    const chat = await Chat.findById(chatId);

    if(!chat) {
      throw new Error("Chat not found");
    }

    // fetch participants
    const participants = chatRoom.get(chatId);

    // if participants exist delete user from participants
    if(!participants) {
      return;
    }

    const receiverWs = participants.get(receiverId);  
    console.log("receiverWs::::", receiverWs);
    if(!receiverWs) {
      return;
    }

    // if chatRoom is empty delete chatRoom
    if (chatRoom.size === 0) {
      chatRoom.delete(chatId);
    }

    console.log("receiverWs::::", receiverWs.readyState);

    // send message to client
    receiverWs?.send(
      JSON.stringify({
        type: "reloadChat",
        payload: {
          success: true,
          message: "Chat reloaded successfully",
          chatId: chatId,
        },
      })
    );

    return;
  } catch (error) {
    console.log(error);
    return;
  }
};
