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
exports.fetchOrdersOfChat = exports.fetchOtherUser = exports.fetchOrderHistory = exports.fetchAllMessages = void 0;
const apiResponse_helper_1 = require("../helper/apiResponse.helper");
const user_models_1 = __importDefault(require("../models/user.models"));
const chat_models_1 = __importDefault(require("../models/chat.models"));
const order_models_1 = __importDefault(require("../models/order.models"));
const message_models_1 = __importDefault(require("../models/message.models"));
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
        const data = yield message_models_1.default.find({ chatId: chatId })
            .populate("order")
            .lean();
        // return res
        return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "Messages fetched successfully", data);
    }
    catch (error) {
        console.log(error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal server error");
    }
});
exports.fetchAllMessages = fetchAllMessages;
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
// fetch order of particular chat
const fetchOrdersOfChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        // fetch orders
        const data = yield order_models_1.default.find({ chat: chatId });
        // return res
        return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "Orders fetched successfully", data);
    }
    catch (error) {
        console.log(error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal server error");
    }
});
exports.fetchOrdersOfChat = fetchOrdersOfChat;
