import User from "../models/user.models";
import Event from "../models/event.models";
import Chat from "../models/chat.models";
import Order from "../models/order.models";
import { chatRoom } from "../index";
import Message from "../models/message.models";
import client from "../config/redis";

// fetchUserChats
export const fetchUserChats = async (userId: any, socket: any) => {
  try {
    // validation
    if (!userId) {
      throw new Error("user is required");
    }

    // validation
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
      .lean()
      .exec();

    // send message to client
    socket.emit("fetchUserAllChats", {
      success: true,
      message: "All chats fetched",
      data: chats,
    });

    return;
  } catch (error) {
    console.log(error);
    socket.emit("fetchUserAllChats", {
      success: false,
      message: "Error fetching chats",
      data: null,
    });
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
    if (socket.readyState === WebSocket.OPEN) {
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
export const markAsRead = async (chatId: any, current: any, other: any, socket: any) => {
  try {

    // validation
    if (!chatId || !current || !other) {
      throw new Error("Invalid input");
    }

    // Find unread messages sent by 'receiverId' to 'userId'
    const messages = await Message.find({
      chatId,
      receiver: current,
      sender: other,
      isSeen: false,
    });

    if (messages.length > 0) {
      await Message.updateMany(
        { chatId, receiver: current, sender: other, isSeen: false }, 
        { $set: { isSeen: true } }
      );
    }

    // Notify sender that their message was read


    // Optionally notify the reader as well


    return;
  } catch (error) {
    console.log(error);
    return;
  }
};

// unseenMessageOfParticularChatIdOfUser
export const unseenMessageOfParticularChatIdOfUser = async (
  parsedData: any,
  socket: any
) => {
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
      chatIds.map(async (chatId: any) => {
        const count = await Message.countDocuments({
          chatId: chatId,
          receiver: userId,
          isSeen: false,
        });
        return { chatId, unSeenCount: count };
      })
    );

    if (counts.length > 0) {
      socket?.send(
        JSON.stringify({
          type: "numOfUnseenMessages",
          payload: counts,
        })
      );
    }

    return;
  } catch (error) {
    console.log(error);
    return;
  }
};

// request order
export const requestOrder = async (formData: any, socket: any, io: any) => {
  try {
    // validation
    if (
      !formData?.location ||
      !formData?.date ||
      !formData?.time ||
      !formData?.additionalInfo ||
      !formData?.cabFare ||
      !formData?.totalPrice ||
      !formData?.eventId ||
      !formData?.sender ||
      !formData?.receiver ||
      !formData?.subId ||
      !formData?.unit
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
    } = formData;

    console.log("first", formData);

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
      text: formData,
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

    // isSender or isReceiver is online
    const senderSocket = await client.get(
      `user:${message?.sender?.toString()}`
    );
    const receiverSocket = await client.get(
      `user:${message?.receiver?.toString()}`
    );

    // send message to receiver -> if chat is open
    const isReceiverOnline = await client.get(`activeChat:${receiver}`);
    if (isReceiverOnline) {
        io.to(receiverSocket).emit("receiveMessage", message);
    }

    // reload chat if necessary
    // send order status
    io.to(senderSocket).emit("orderStatus", {
      success: true,
      message: "Order request sent",
      data: {
        chatId: chat?._id,
        receiver: receiver,
      }
    });

    return;
  } catch (error) {
    console.log("error", error);

    // send response to client
    socket?.emit("orderStatus", {
      success: false,
      message: "Order request failed",
    });
    throw new Error("Order request failed");
  }
};

// sendMessage
export const sendMessage = async (
  messagePayload: any,
  io: any
): Promise<any> => {
  try {

    // Validate payload
    if (
      !messagePayload ||
      !messagePayload.sender ||
      !messagePayload.receiver ||
      !messagePayload.chatId ||
      !messagePayload.text
    ) {
      console.log("Invalid data received:", messagePayload);
      return;
    }

    // fetch data
    const { sender, receiver, chatId, text } = messagePayload;

    // Get chat participants and sockets
    const senderSocket = await client.hget(`chat:${chatId}`, sender);
    const receiverSocket = await client.hget(`chat:${chatId}`, receiver);
    const isReceiverOnline = await client.get(`user:${receiver}`);
    const receiverActiveChatId = await client.get(`activeChat:${receiver}`);

    // Create and save message
    const message = new Message({
      sender,
      receiver,
      chatId,
      text,
      isSeen: isReceiverOnline && receiverActiveChatId === chatId,
    });
    await message.save();

    // if receiver is in same chat send message to receiver
    if (receiverActiveChatId === chatId) {
      // means they are in same chat

      // send live message to receiver
      if (receiverSocket) {
        io.to(receiverSocket).emit("receiveMessage", message);
      } else {
        console.log(`Receiver socket for ${receiver} is not open`);
      }
    }

    // if sender is active send message to sender
    if(senderSocket) {
      io.to(senderSocket).emit("receiveMessage", message);
    } else {
      console.log(`Sender socket for ${sender} is not open`);
    }

    // Update chat with the new message
    await Chat.findByIdAndUpdate(
      chatId,
      { $push: { message: message._id } },
      { new: true }
    );
  } catch (error) {
    console.error("Error in sendMessage:", error);
  }
};

// acceptOrder
export const acceptOrder = async (msgId: any, mark:any, socket: any, io: any, chatId: any, current: any, other: any
) => {
  try {

    // validation
    if (!msgId || !mark || !socket || !io || !chatId || !current || !other) {
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

    // sender and receiver socket
    const senderSocket = await client.hget(`chat:${chatId}`, current);
    const receiverSocket = await client.hget(`chat:${chatId}`, other);

    // send response to client
    io.to(senderSocket).emit("orderAccepted", {
      success: true,
      message: `Order ${mark} successfully`,
    });

    // reload chat
    io.to(senderSocket).emit("reloadChat");

    // send response to receiver
    io.to(receiverSocket).emit("orderAccepted", {
      success: true,
      message: `Your Order ${mark}, ${mark === "accepted" ? "please do payment" : ""}`,
      data: mark
    });

    // reload chat
    io.to(receiverSocket).emit("reloadChat");

    return;
  } catch (error) {
    console.log(error);
    return;
  }
};

// reloadChatPage
export const reloadChatPage = async (receiverId: any, chatId: any, socket: any, io:any) => {
  try {

    // validation
    if (!receiverId || !chatId) {
      throw new Error("Invalid payload structure");
    }

    // fetch chat
    const chat = await Chat.findById(chatId);

    if (!chat) {
      throw new Error("Chat not found");
    }

    // send message to receiver client
    const receiverSocket = await client.hget(`chat:${chatId}`, receiverId);

    if(!receiverSocket) {
        return;
    }

    io.to(receiverSocket).emit("reloadChat");

    return;
  } catch (error) {
    console.log(error);
    return;
  }
};
