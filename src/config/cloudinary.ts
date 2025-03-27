import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config(); // Ensure this runs before accessing process.env

export const cloudinaryConnect = () => {
  try {
    console.log("Cloudinary ENV Vars:", {
      CLOUD_NAME: process.env.CLOUD_NAME,
      API_KEY: process.env.API_KEY ? "✅" : "❌ MISSING",
      API_SECRET: process.env.API_SECRET ? "✅" : "❌ MISSING",
    });

    if (!process.env.CLOUD_NAME || !process.env.API_KEY || !process.env.API_SECRET) {
      throw new Error("Missing Cloudinary API credentials in .env file.");
    }

    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME!,
      api_key: process.env.API_KEY! ,
      api_secret: process.env.API_SECRET!,
    });

    console.log("Cloudinary connected successfully ✅");
  } catch (error) {
    console.error("Cloudinary configuration error:", error);
    throw new Error("Cloudinary configuration failed.");
  }
};
