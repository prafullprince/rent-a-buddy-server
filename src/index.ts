import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import http from 'http';
import rateLimit from "express-rate-limit";

// routes
import authRoutes from "./routes/auth.routes";
import categoryRoutes from "./routes/category.routes";
import eventRoutes from './routes/event.routes';
import chatRoutes from  "./routes/chat.routes";
import userRoutes from "./routes/user.routes";
import paymentRoutes from "./routes/payment.routes";

// dbConnect
import connectDB from "./config/mongodb";
import { cloudinaryConnect } from "./config/cloudinary";
import { WebSocketServer } from "ws";
import { acceptOrder, fetchUserChats, markAsRead, registerUserInChatRoom, reloadChatPage, requestOrder, sendMessage, unseenMessageOfParticularChatIdOfUser, unseenMessages } from "./controllers/order.controllers";

dotenv.config(); // Load environment variables

// Create Express server
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// memory for socket
export const chatRoom = new Map<string, Map<string, WebSocket>>();
export const userMap = new Map<string, string>();
export let senderSocket: null | WebSocket = null;
export let receiverSocket: null | WebSocket = null;

// allowed origins
const allowedOrigins = ['https://www.rentabuddy.in/', 'https://rent-a-buddy-client.vercel.app/'];

// wesocket logic
wss.on("connection", (socket:any)=>{
  console.log("connected");

  socket.on("message", (data:any)=>{
    console.log("data:::", data);

    // parsedData
    if(!data){
      return;
    }
    const parsedData = JSON.parse(data.toString());
    console.log("parsedData", parsedData);

    // register user
    if( parsedData.type === "register" ) {
      registerUserInChatRoom( parsedData, socket );
    }

    // openChat
    if( parsedData.type === "openChat" ) {
      console.log("openChat");
      userMap?.set(parsedData.payload.userId, parsedData.payload.chatId);
    }

    // closeChat
    if( parsedData.type === "closeChat" ) {
      console.log("closeChat");
      userMap?.delete(parsedData.payload.userId);
    }

    // ping
    if (parsedData.type === "ping") {
      socket.send(JSON.stringify({ type: "pong" }));
      return;
    }

    // sendMessage
    if( parsedData.type === "sendMessage" ) {
      sendMessage( parsedData );
    }

    // requestOrder
    if( parsedData.type === "requestOrder" ) {
      console.log("requestOrder");
      requestOrder( parsedData, socket );
    }

    // acceptOrder
    if( parsedData.type === "acceptOrder" ) {
      console.log("acceptOrder");
      acceptOrder( parsedData, socket );
    }

    // reloadChat
    if (parsedData.type === "reloadChatPage" ) {
      console.log("reloadChatPagesd,f sdm fdms fmndsfnm");
      reloadChatPage(parsedData, socket);
    }

    // markAsRead
    if( parsedData.type === "markAsRead" ) {
      console.log("markAsRead");
      markAsRead( parsedData, socket );
    }

    // no of unseenMessages
    if( parsedData.type === "unseenMessages" ) {
      console.log("unseenMessages");
      unseenMessages( parsedData, socket );
    }

    // unseenMessages of particular chatId
    if( parsedData.type === "unseenMessageOfParticularChatIdOfUser" ) {
      unseenMessageOfParticularChatIdOfUser( parsedData, socket );
    }

    // fetchAllChat
    if( parsedData.type === "fetchAllChat" ) {
      console.log("fetchAllChat");
      fetchUserChats( parsedData, socket );
    }

    // createOffer
    else if( parsedData.type === "createOffer" ) {
      console.log("createOffer");
      const { chatId, userId, offer } = parsedData.payload;

      // get participants
      const participants = chatRoom.get(chatId);
      if(!participants) return;

      // get receiver socket
      const receiverSocket = participants.get(userId);

      // if receiverSocket is not available return
      if(!receiverSocket) return;

      // send offer to receiver
      receiverSocket.send(JSON.stringify({ type: "createOffer", payload: offer }));
    }

    // createAnswer
    else if( parsedData.type === "createAnswer" ) {
      console.log("createAnswer");

      const { chatId, userId, sdp } = parsedData.payload;
      
      // get participants
      const participants = chatRoom.get(chatId);
      if(!participants) return;

      // get sender socket
      const senderSocket = participants.get(userId);

      // if senderSocket is not available return
      if(!senderSocket) return;

      // send offer to sender
      senderSocket.send(JSON.stringify({ type: "createAnswer", payload: sdp }));
    }

    // add-ice-candidate
    else if( parsedData.type === "add-ice-candidate" ) {
      console.log("add-ice-candidate");

      const { chatId, userId, candidate } = parsedData.payload;

      // check socket of which one sender or receiver
      
      // get participants
      const participants = chatRoom.get(chatId);
      if(!participants) return;

      // get receiver socket
      const receiverSocket = participants.get(userId);

      // if receiverSocket is not available return
      if(!receiverSocket) return;
  
      // add-ice-candidate over receiver
      receiverSocket.send(JSON.stringify({ type: "add-ice-candidate", payload: candidate }));
    }

    else if( parsedData.type === "endCall" ) {
      console.log("endCall");

      const { chatId, userId } = parsedData.payload;

      // get participants
      const participants = chatRoom.get(chatId);
      if(!participants) return;

      // get sender socket
      const receiverSocket = participants.get(userId);

      // if senderSocket is not available return
      if(!receiverSocket) return;

      // endCall over sender
      receiverSocket.send(JSON.stringify({ type: "endCall" }));
    }
  })

})

// rate limit
const globalLimiter = rateLimit({
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
})

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    limits: { fileSize: 5 * 1024 * 1024 },
    abortOnLimit: true,
    safeFileNames: true,
    preserveExtension: true,
  })
);
app.use(cookieParser());
app.use(cors(
  {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}
));
app.use(helmet());
app.use(compression());
// app.use(morgan("combined")); // Logs requests
app.use(globalLimiter);


// PORT
const PORT = process.env.PORT || 10000;

// db
connectDB();
cloudinaryConnect();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/event", eventRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/user", userRoutes);
app.use("/api/payment", paymentRoutes);

// Home route
app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server is Running!");
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
