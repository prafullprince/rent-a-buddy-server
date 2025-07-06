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
exports.receiverSocket = exports.senderSocket = exports.userMap = exports.chatRoom = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const http_1 = __importDefault(require("http"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const socket_io_1 = require("socket.io");
// routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const event_routes_1 = __importDefault(require("./routes/event.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
// dbConnect
const mongodb_1 = __importDefault(require("./config/mongodb"));
const cloudinary_1 = require("./config/cloudinary");
const redis_1 = __importDefault(require("./config/redis"));
const socket_controller_1 = require("./controllers/socket.controller");
dotenv_1.default.config(); // Load environment variables
// Create Express server
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
    },
});
// memory for socket
exports.chatRoom = new Map();
exports.userMap = new Map();
exports.senderSocket = null;
exports.receiverSocket = null;
// allowed origins
const allowedOrigins = [
    "https://www.rentabuddy.in",
    "https://rent-a-buddy-client.vercel.app", "http://localhost:3000"
];
// socket logic
io.on("connection", (socket) => {
    // Register user
    socket.on("register", (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId }) {
        // Store userId -> socketId
        yield redis_1.default.set(`user:${userId}`, socket.id);
        // Store socketId -> userId
        yield redis_1.default.set(`socket:${socket.id}`, userId);
        // send toast of online
        io.to(socket.id).emit("online");
    }));
    // registerUserInChat
    socket.on("registerUserInChat", (_a) => __awaiter(void 0, [_a], void 0, function* ({ chatId, userId }) {
        // store chatId -> userId and socket
        yield redis_1.default.hset(`chat:${chatId}`, userId, socket.id);
        // store socketId -> userId
        yield redis_1.default.hset(`sockets:${socket.id}`, "userId", userId);
        // track all chat this socket joined
        yield redis_1.default.sadd(`sockets:${socket.id}:chats`, chatId);
        // send toast of online
        io.to(socket.id).emit("Connected");
    }));
    // openChat
    socket.on("openChat", (_a) => __awaiter(void 0, [_a], void 0, function* ({ chatId, userId }) {
        console.log("openChat");
        if (!chatId || !userId)
            return;
        // mark this user is online in this chat
        yield redis_1.default.set(`activeChat:${userId}`, chatId);
    }));
    // closeChat
    socket.on("closeChat", (_a) => __awaiter(void 0, [_a], void 0, function* ({ chatId, userId }) {
        console.log("closeChat");
        if (!chatId || !userId)
            return;
        yield redis_1.default.del(`activeChat:${userId}`);
    }));
    // requestOrder
    socket.on("requestOrder", (formData) => {
        console.log("requestOrder");
        (0, socket_controller_1.requestOrder)(formData, socket, io);
    });
    // fetchAllChat
    socket.on("fetchAllChat", ({ userId }) => {
        console.log("fetchAllChat");
        (0, socket_controller_1.fetchUserChats)(userId, socket);
    });
    // sendMessage
    socket.on("sendMessage", (messagePayload) => {
        console.log("sendMessage");
        (0, socket_controller_1.sendMessage)(messagePayload, io);
    });
    // markAsRead
    socket.on("markAsRead", ({ chatId, current, other }) => {
        console.log("markAsRead");
        (0, socket_controller_1.markAsRead)(chatId, current, other, socket);
    });
    // acceptOrder
    socket.on("acceptOrder", ({ msgId, mark, chatId, current, other }) => {
        console.log("acceptOrder");
        (0, socket_controller_1.acceptOrder)(msgId, mark, socket, io, chatId, current, other);
    });
    // reloadChatPage
    socket.on("reloadChatPage", ({ receiverId, chatId }) => {
        console.log("reloadChatPage");
        (0, socket_controller_1.reloadChatPage)(receiverId, chatId, socket, io);
    });
    // add-ice-candidate
    socket.on("add-ice-candidate", (_a) => __awaiter(void 0, [_a], void 0, function* ({ chatId, userId, candidate }) {
        console.log("add-ice-candidate");
        const receiverSocket = yield redis_1.default.hget(`chat:${chatId}`, userId);
        if (!receiverSocket)
            return;
        io.to(receiverSocket).emit("accept-ice-candidate", { candidate });
    }));
    // createOffer
    socket.on("createOffer", (_a) => __awaiter(void 0, [_a], void 0, function* ({ chatId, userId, offer }) {
        console.log("createOffer");
        const receiverSocket = yield redis_1.default.hget(`chat:${chatId}`, userId);
        if (!receiverSocket)
            return;
        io.to(receiverSocket).emit("acceptOffer", { offer });
    }));
    // createAnswer
    socket.on("createAnswer", (_a) => __awaiter(void 0, [_a], void 0, function* ({ chatId, userId, answer }) {
        console.log("createAnswer");
        const receiverSocket = yield redis_1.default.hget(`chat:${chatId}`, userId);
        if (!receiverSocket)
            return;
        io.to(receiverSocket).emit("acceptAnswer", { answer });
    }));
    // rejectCall
    socket.on("rejectCall", (_a) => __awaiter(void 0, [_a], void 0, function* ({ chatId, userId }) {
        console.log("rejectCall");
        const receiverSocket = yield redis_1.default.hget(`chat:${chatId}`, userId);
        if (!receiverSocket)
            return;
        io.to(receiverSocket).emit("rejectCall");
    }));
    // endCall
    socket.on("endCall", (_a) => __awaiter(void 0, [_a], void 0, function* ({ chatId, userId }) {
        console.log("endCall");
        const receiverSocket = yield redis_1.default.hget(`chat:${chatId}`, userId);
        if (!receiverSocket)
            return;
        io.to(receiverSocket).emit("endCall");
    }));
    // toggleMic
    socket.on("toggleMic", (_a) => __awaiter(void 0, [_a], void 0, function* ({ isMuted, chatId, userId }) {
        console.log("toggleMic");
        const receiverSocket = yield redis_1.default.hget(`chat:${chatId}`, userId);
        if (!receiverSocket)
            return;
        io.to(receiverSocket).emit("toggleMic", { isMuted });
    }));
    // toggleCamera
    socket.on("toggleCamera", (_a) => __awaiter(void 0, [_a], void 0, function* ({ isMuted, chatId, userId }) {
        console.log("toggleCamera");
        const receiverSocket = yield redis_1.default.hget(`chat:${chatId}`, userId);
        if (!receiverSocket)
            return;
        io.to(receiverSocket).emit("toggleCamera", { isMuted });
    }));
    // On disconnect -> remove user from room
    socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
        console.log("disconnect");
        const userId = yield redis_1.default.get(`socket:${socket.id}`);
        const chatUserId = yield redis_1.default.hget(`sockets:${socket.id}`, "userId");
        const chatIds = yield redis_1.default.smembers(`sockets:${socket.id}:chats`);
        // remove registr user
        if (userId) {
            yield redis_1.default.del(`user:${userId}`);
            yield redis_1.default.del(`socket:${socket.id}`);
        }
        // remove register chatRoom
        // -> remove user from all chat
        if (chatUserId && chatIds) {
            chatIds.forEach((chatId) => __awaiter(void 0, void 0, void 0, function* () {
                yield redis_1.default.hdel(`chat:${chatId}`, chatUserId);
            }));
        }
        // -> remove socket from all chat
        yield redis_1.default.del(`sockets:${socket.id}:chats`);
        yield redis_1.default.hdel(`sockets:${socket.id}`, "userId");
    }));
});
// rate limit
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per windowMs
    handler: (req, res) => {
        return res.status(429).json({
            success: false,
            message: "Too many requests. Please try after 1 minute.",
        });
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
// Middleware
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.use(
// @ts-ignore
(0, express_fileupload_1.default)({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    limits: { fileSize: 5 * 1024 * 1024 },
    abortOnLimit: true,
    safeFileNames: true,
    preserveExtension: true,
}));
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
// app.use(morgan("combined")); // Logs requests
app.use(globalLimiter);
// PORT
const PORT = process.env.PORT || 10000;
// db
(0, mongodb_1.default)();
(0, cloudinary_1.cloudinaryConnect)();
// Routes
app.use("/api/auth", auth_routes_1.default);
app.use("/api/category", category_routes_1.default);
app.use("/api/event", event_routes_1.default);
app.use("/api/chat", chat_routes_1.default);
app.use("/api/user", user_routes_1.default);
app.use("/api/payment", payment_routes_1.default);
// Home route
app.get("/", (req, res) => {
    res.send("Express + TypeScript Server is Running!");
});
// Start server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
