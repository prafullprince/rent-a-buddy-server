"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// import
const mongoose_1 = __importStar(require("mongoose"));
// schema
const userSchema = new mongoose_1.Schema({
    username: {
        type: String,
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
    },
    lastLogin: {
        type: Date,
    },
    provider: [{
            type: String,
        }],
    role: {
        type: String,
        enum: ["User", "Admin", "Buddy"],
        default: "User",
    },
    favourite: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "Event",
        }],
    chats: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "Chat",
        }],
    notifications: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "Notification",
        }],
    profile: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Profile",
    },
    wallet: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Wallet",
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    refunds: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "Refund",
        }],
    earnings: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "Earning",
        }],
    posts: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "Post",
        }],
    events: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "Event",
        }],
    reports: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "Report",
        }],
    image: {
        type: String,
    },
    blockedList: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "User",
        }],
    following: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "User",
        }],
    followers: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "User",
        }],
    isOnline: {
        type: Boolean,
        default: false,
    },
    orderHistory: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "Order",
        }],
    ratingAndReviews: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "RatingAndReview",
        }],
    ethnicity: {
        type: String,
        enum: ["Indian", "Pakistani", "Bangladeshi", "Chinese", "Other"],
        default: "Indian",
    },
    phoneNumber: {
        type: String,
    },
}, { timestamps: true });
// export
const User = mongoose_1.default.model("User", userSchema);
exports.default = User;
