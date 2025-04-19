"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinaryConnect = void 0;
const cloudinary_1 = require("cloudinary");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Ensure this runs before accessing process.env
const cloudinaryConnect = () => {
    try {
        console.log("Cloudinary ENV Vars:", {
            CLOUD_NAME: process.env.CLOUD_NAME,
            API_KEY: process.env.API_KEY ? "✅" : "❌ MISSING",
            API_SECRET: process.env.API_SECRET ? "✅" : "❌ MISSING",
        });
        if (!process.env.CLOUD_NAME || !process.env.API_KEY || !process.env.API_SECRET) {
            throw new Error("Missing Cloudinary API credentials in .env file.");
        }
        cloudinary_1.v2.config({
            cloud_name: process.env.CLOUD_NAME,
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET,
        });
        console.log("Cloudinary connected successfully ✅");
    }
    catch (error) {
        console.error("Cloudinary configuration error:", error);
        throw new Error("Cloudinary configuration failed.");
    }
};
exports.cloudinaryConnect = cloudinaryConnect;
