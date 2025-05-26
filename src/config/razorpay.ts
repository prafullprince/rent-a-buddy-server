import Razorpay from "razorpay";
import { configDotenv } from "dotenv";
configDotenv();

export const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!
});

// console.log("key_id",process.env.RAZORPAY_KEY_ID)
// console.log("key_secret",process.env.RAZORPAY_KEY_SECRET)
