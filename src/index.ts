import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import authRoutes from "./routes/auth.routes";
import connectDB from "./config/mongodb";

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

// Routes
app.use("/api/auth", authRoutes);

// Home route
app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server is Running!");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
