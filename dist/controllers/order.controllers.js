"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchOtherUser = exports.fetchOrderHistory = exports.fetchChat = exports.fetchAllMessages = exports.sendMessage = exports.registerUserInChatRoom = exports.removeUserFromChatRoom = exports.requestOrder = void 0;
const apiResponse_helper_1 = require("../helper/apiResponse.helper");
const user_models_1 = __importDefault(require("../models/user.models"));
const event_models_1 = __importDefault(require("../models/event.models"));
const chat_models_1 = __importDefault(require("../models/chat.models"));
const order_models_1 = __importDefault(require("../models/order.models"));
const index_1 = require("../index");
const message_models_1 = __importDefault(require("../models/message.models"));
// request order
const requestOrder = (parsedData, socket) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
    let senderWs;
    try {
        // validation
        if (!((_b = (_a = parsedData === null || parsedData === void 0 ? void 0 : parsedData.payload) === null || _a === void 0 ? void 0 : _a.formData) === null || _b === void 0 ? void 0 : _b.location) ||
            !((_d = (_c = parsedData === null || parsedData === void 0 ? void 0 : parsedData.payload) === null || _c === void 0 ? void 0 : _c.formData) === null || _d === void 0 ? void 0 : _d.date) ||
            !((_f = (_e = parsedData === null || parsedData === void 0 ? void 0 : parsedData.payload) === null || _e === void 0 ? void 0 : _e.formData) === null || _f === void 0 ? void 0 : _f.time) ||
            !((_h = (_g = parsedData === null || parsedData === void 0 ? void 0 : parsedData.payload) === null || _g === void 0 ? void 0 : _g.formData) === null || _h === void 0 ? void 0 : _h.additionalInfo) ||
            !((_k = (_j = parsedData === null || parsedData === void 0 ? void 0 : parsedData.payload) === null || _j === void 0 ? void 0 : _j.formData) === null || _k === void 0 ? void 0 : _k.cabFare) ||
            !((_m = (_l = parsedData === null || parsedData === void 0 ? void 0 : parsedData.payload) === null || _l === void 0 ? void 0 : _l.formData) === null || _m === void 0 ? void 0 : _m.totalPrice) ||
            !((_p = (_o = parsedData === null || parsedData === void 0 ? void 0 : parsedData.payload) === null || _o === void 0 ? void 0 : _o.formData) === null || _p === void 0 ? void 0 : _p.eventId) ||
            !((_r = (_q = parsedData === null || parsedData === void 0 ? void 0 : parsedData.payload) === null || _q === void 0 ? void 0 : _q.formData) === null || _r === void 0 ? void 0 : _r.sender) ||
            !((_t = (_s = parsedData === null || parsedData === void 0 ? void 0 : parsedData.payload) === null || _s === void 0 ? void 0 : _s.formData) === null || _t === void 0 ? void 0 : _t.receiver) ||
            !((_v = (_u = parsedData === null || parsedData === void 0 ? void 0 : parsedData.payload) === null || _u === void 0 ? void 0 : _u.formData) === null || _v === void 0 ? void 0 : _v.subId) ||
            !((_x = (_w = parsedData === null || parsedData === void 0 ? void 0 : parsedData.payload) === null || _w === void 0 ? void 0 : _w.formData) === null || _x === void 0 ? void 0 : _x.unit)) {
            throw new Error("Invalid payload structure");
        }
        // fetch data
        const { location, date, time, additionalInfo, cabFare, totalPrice, eventId, sender, receiver, subId, unit } = parsedData.payload.formData;
        // validation on event, user
        const [fromUser, toUser, isEvent] = yield Promise.all([
            user_models_1.default.findById(sender).lean(),
            user_models_1.default.findById(receiver).lean(),
            event_models_1.default.findById(eventId).lean(),
        ]);
        if (!fromUser || !toUser || !isEvent) {
            throw new Error("Bad request");
        }
        // checkIsChatExists -> if not create chat
        let chat = yield chat_models_1.default.findOne({ participants: { $all: [sender, receiver] } });
        if (!chat) {
            chat = yield chat_models_1.default.create({
                participants: [sender, receiver]
            });
        }
        // create order
        const order = yield order_models_1.default.create({
            location,
            date,
            time,
            additionalInfo,
            cabFare,
            totalPrice,
            event: eventId,
            sender,
            receiver,
            subId: subId === null || subId === void 0 ? void 0 : subId._id,
            unit,
            chat: chat === null || chat === void 0 ? void 0 : chat._id,
        });
        // createMessage
        const message = new message_models_1.default({
            sender,
            receiver,
            chatId: chat === null || chat === void 0 ? void 0 : chat._id,
            text: parsedData.payload.formData,
            type: "order",
        });
        yield message.save();
        // update chat with the new message
        const updatedChat = yield chat_models_1.default.findByIdAndUpdate(chat === null || chat === void 0 ? void 0 : chat._id, { $push: { message: message._id } }, { new: true });
        // update chatRoom
        if (!index_1.chatRoom.get(chat === null || chat === void 0 ? void 0 : chat._id.toString())) {
            index_1.chatRoom.set(chat === null || chat === void 0 ? void 0 : chat._id.toString(), new Map());
        }
        // participants
        const participants = index_1.chatRoom.get(chat === null || chat === void 0 ? void 0 : chat._id.toString());
        participants === null || participants === void 0 ? void 0 : participants.set(sender, socket);
        participants === null || participants === void 0 ? void 0 : participants.set(receiver, socket);
        senderWs = participants === null || participants === void 0 ? void 0 : participants.get(sender);
        const receiverWs = participants === null || participants === void 0 ? void 0 : participants.get(receiver);
        // send message to sender
        if ((senderWs === null || senderWs === void 0 ? void 0 : senderWs.readyState) === WebSocket.OPEN) {
            senderWs.send(JSON.stringify({ type: "receiveMessage", payload: message }));
        }
        else {
            console.log(`Sender socket for ${sender} is not open`);
        }
        // send message to receiver
        if ((receiverWs === null || receiverWs === void 0 ? void 0 : receiverWs.readyState) === WebSocket.OPEN) {
            receiverWs.send(JSON.stringify({ type: "receiveMessage", payload: message }));
        }
        else {
            console.log(`Receiver socket for ${receiver} is not open`);
        }
        // send response to client
        senderWs === null || senderWs === void 0 ? void 0 : senderWs.send(JSON.stringify({
            type: "orderStatus",
            payload: {
                success: true,
                message: "Order request sent successfully",
                data: message
            }
        }));
        return;
    }
    catch (error) {
        console.log(error);
        // send response to client
        senderWs === null || senderWs === void 0 ? void 0 : senderWs.send(JSON.stringify({
            type: "orderStatus",
            payload: {
                success: false,
                message: "Order request failed",
            }
        }));
        return;
    }
});
exports.requestOrder = requestOrder;
// removeChatFromRoom
const removeUserFromChatRoom = (chatId, userId) => {
    try {
        // fetch participants
        const participants = index_1.chatRoom.get(chatId);
        // if participants exist delete user from participants
        if (participants) {
            participants.delete(userId);
        }
        // if chatRoom is empty delete chatRoom
        if (index_1.chatRoom.size === 0) {
            index_1.chatRoom.delete(chatId);
        }
    }
    catch (error) {
        console.log("error", error);
    }
};
exports.removeUserFromChatRoom = removeUserFromChatRoom;
// registerUserInChatRoom
const registerUserInChatRoom = (parsedData, socket) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // validation
        if (!(parsedData === null || parsedData === void 0 ? void 0 : parsedData.payload)) {
            throw new Error("Invalid payload structure");
        }
        // fetch data
        const { chatId, userId } = parsedData.payload;
        // validation
        if (!chatId || !userId) {
            throw new Error("Invalid payload structure");
        }
        // chatRoom
        if (!index_1.chatRoom.get(chatId)) {
            index_1.chatRoom.set(chatId, new Map());
        }
        // participants
        const participants = index_1.chatRoom.get(chatId);
        participants === null || participants === void 0 ? void 0 : participants.set(userId, socket);
        // Handle disconnection
        socket.on("disconnect", () => {
            (0, exports.removeUserFromChatRoom)(chatId, userId);
        });
    }
    catch (error) {
        console.log(error);
        return;
    }
});
exports.registerUserInChatRoom = registerUserInChatRoom;
// sendMessage
const sendMessage = (parsedData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate payload
        if (!(parsedData === null || parsedData === void 0 ? void 0 : parsedData.payload) ||
            !parsedData.payload.sender ||
            !parsedData.payload.receiver ||
            !parsedData.payload.chatId ||
            !parsedData.payload.text) {
            console.log("Invalid data received:", parsedData);
            return;
        }
        const { sender, receiver, chatId, text } = parsedData.payload;
        // Get chat participants
        const participants = index_1.chatRoom.get(chatId);
        if (!participants) {
            console.log("No active participants found for chatId:", chatId);
            return;
        }
        const senderSocket = participants === null || participants === void 0 ? void 0 : participants.get(sender);
        const receiverSocket = participants === null || participants === void 0 ? void 0 : participants.get(receiver);
        // Create and save message
        const message = new message_models_1.default({ sender, receiver, chatId, text });
        yield message.save();
        // Send message to sender
        if ((senderSocket === null || senderSocket === void 0 ? void 0 : senderSocket.readyState) === WebSocket.OPEN) {
            senderSocket.send(JSON.stringify({ type: "receiveMessage", payload: message }));
        }
        else {
            console.log(`Sender socket for ${sender} is not open`);
        }
        // Send message to receiver
        if ((receiverSocket === null || receiverSocket === void 0 ? void 0 : receiverSocket.readyState) === WebSocket.OPEN) {
            receiverSocket.send(JSON.stringify({ type: "receiveMessage", payload: message }));
        }
        else {
            console.log(`Receiver socket for ${receiver} is not open`);
        }
        console.log("senderSocket readyState", senderSocket === null || senderSocket === void 0 ? void 0 : senderSocket.readyState);
        console.log("receiverSocket readyState", receiverSocket === null || receiverSocket === void 0 ? void 0 : receiverSocket.readyState);
        console.log("websocket is open", WebSocket.OPEN);
        // Update chat with the new message
        const updatedChat = yield chat_models_1.default.findByIdAndUpdate(chatId, { $push: { message: message._id } }, { new: true });
        if (!updatedChat) {
            console.log("Failed to update chat:", chatId);
        }
        else {
            console.log("Chat updated successfully:", updatedChat);
        }
    }
    catch (error) {
        console.error("Error in sendMessage:", error);
    }
});
exports.sendMessage = sendMessage;
// fetchAllMessages
const fetchAllMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // fetch data
        const { chatId } = req.body;
        // validation
        if (!chatId) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "All fields are required");
        }
        // fetch chat
        const chat = yield chat_models_1.default.findById(chatId);
        // validation
        if (!chat) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 404, "Chat not found");
        }
        // fetch messages
        const data = yield message_models_1.default.find({ chatId: chatId }).lean();
        // return res
        return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "Messages fetched successfully", data);
    }
    catch (error) {
        console.log(error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal server error");
    }
});
exports.fetchAllMessages = fetchAllMessages;
// fetchChat
const fetchChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // fetch data
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // validation
        if (!userId) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "All fields are required");
        }
        // fetch user
        const user = yield user_models_1.default.findById(userId);
        // validation
        if (!user) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 404, "User not found");
        }
        // fetch chats
        const data = yield chat_models_1.default.find({ participants: userId })
            .populate({
            path: "participants",
            select: "_id username image",
        })
            .populate({
            path: "message",
            select: "_id text",
        });
        // return res
        return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "Chats fetched successfully", data);
    }
    catch (error) {
        console.log(error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal server error");
    }
});
exports.fetchChat = fetchChat;
// fetchOrderHistory -> TODO
const fetchOrderHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // fetch data
        const { userId } = req.body;
        // validation
        if (!userId) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "All fields are required");
        }
        // fetch user
        const user = yield user_models_1.default.findById(userId);
        // validation
        if (!user) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 404, "User not found");
        }
        // fetch orders
        const data = yield order_models_1.default.find({ sender: userId });
        // return res
        return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "Orders fetched successfully", data);
    }
    catch (error) {
        console.log(error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal server error");
    }
});
exports.fetchOrderHistory = fetchOrderHistory;
// fetchOtherUser
const fetchOtherUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // fetch data
        const { userId } = req.body;
        // validation
        if (!userId) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "All fields are required");
        }
        // fetch user
        const data = yield user_models_1.default.findById(userId).select("_id username image");
        // return res
        return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "User fetched successfully", data);
    }
    catch (error) {
        console.log(error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal server error");
    }
});
exports.fetchOtherUser = fetchOtherUser;
