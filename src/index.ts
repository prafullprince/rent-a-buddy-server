import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';

// routes
import authRoutes from "./routes/auth.routes";
import categoryRoutes from "./routes/category.routes";
import eventRoutes from './routes/event.routes';


// dbConnect
import connectDB from "./config/mongodb";
import { cloudinaryConnect } from "./config/cloudinary";

dotenv.config(); // Load environment variables


// Create Express server
const app = express();

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
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan("combined")); // Logs requests

// PORT
const PORT = process.env.PORT || 5000;

// db
connectDB();
cloudinaryConnect();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/event", eventRoutes);

// Home route
app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server is Running!");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
