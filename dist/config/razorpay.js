"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.instance = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.configDotenv)();
exports.instance = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});
// console.log("key_id",process.env.RAZORPAY_KEY_ID)
// console.log("key_secret",process.env.RAZORPAY_KEY_SECRET)
