"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userMap = exports.chatRoom = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const http_1 = __importDefault(require("http"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
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
const ws_1 = require("ws");
const order_controllers_1 = require("./controllers/order.controllers");
dotenv_1.default.config(); // Load environment variables
// Create Express server
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const wss = new ws_1.WebSocketServer({ server });
exports.chatRoom = new Map();
exports.userMap = new Map();
// wesocket logic
wss.on("connection", (socket) => {
    console.log("connected");
    socket.on("message", (data) => {
        console.log("data:::", data);
        // parsedData
        if (!data) {
            return;
        }
        const parsedData = JSON.parse(data.toString());
        console.log("parsedData", parsedData);
        // register user
        if (parsedData.type === "register") {
            (0, order_controllers_1.registerUserInChatRoom)(parsedData, socket);
        }
        // openChat
        if (parsedData.type === "openChat") {
            console.log("openChat");
            exports.userMap === null || exports.userMap === void 0 ? void 0 : exports.userMap.set(parsedData.payload.userId, parsedData.payload.chatId);
        }
        // closeChat
        if (parsedData.type === "closeChat") {
            console.log("closeChat");
            exports.userMap === null || exports.userMap === void 0 ? void 0 : exports.userMap.delete(parsedData.payload.userId);
        }
        // ping
        if (parsedData.type === "ping") {
            socket.send(JSON.stringify({ type: "pong" }));
            return;
        }
        // sendMessage
        if (parsedData.type === "sendMessage") {
            (0, order_controllers_1.sendMessage)(parsedData);
        }
        // requestOrder
        if (parsedData.type === "requestOrder") {
            console.log("requestOrder");
            (0, order_controllers_1.requestOrder)(parsedData, socket);
        }
        // acceptOrder
        if (parsedData.type === "acceptOrder") {
            console.log("acceptOrder");
            (0, order_controllers_1.acceptOrder)(parsedData, socket);
        }
        // reloadChat
        if (parsedData.type === "reloadChatPage") {
            console.log("reloadChatPagesd,f sdm fdms fmndsfnm");
            (0, order_controllers_1.reloadChatPage)(parsedData, socket);
        }
        // markAsRead
        if (parsedData.type === "markAsRead") {
            console.log("markAsRead");
            (0, order_controllers_1.markAsRead)(parsedData, socket);
        }
        // no of unseenMessages
        if (parsedData.type === "unseenMessages") {
            console.log("unseenMessages");
            (0, order_controllers_1.unseenMessages)(parsedData, socket);
        }
        // unseenMessages of particular chatId
        if (parsedData.type === "unseenMessageOfParticularChatIdOfUser") {
            (0, order_controllers_1.unseenMessageOfParticularChatIdOfUser)(parsedData, socket);
        }
        // fetchAllChat
        if (parsedData.type === "fetchAllChat") {
            console.log("fetchAllChat");
            (0, order_controllers_1.fetchUserChats)(parsedData, socket);
        }
    });
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
app.use((0, express_fileupload_1.default)({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    limits: { fileSize: 5 * 1024 * 1024 },
    abortOnLimit: true,
    safeFileNames: true,
    preserveExtension: true,
}));
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)());
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
