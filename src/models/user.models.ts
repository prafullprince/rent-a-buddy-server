// import
import mongoose, { Schema } from "mongoose";
import { IUser } from "../types/schema/userSchema.types";


// schema
const userSchema:Schema = new Schema({
    username:{
        type:String,
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
    },
    lastLogin: {
        type: Date,
    },
    provider: [{
        type: String,
    }],
    role: {
        type: String,
        enum: ["User", "Admin","Buddy"],
        default: "User",
    },
    favourite: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
    }],
    chats: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
    }],
    notifications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notification",
    }],
    profile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile",
    },
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wallet",
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    refunds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Refund",
    }],
    earnings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Earning",
    }],
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
    }],
    events: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
    }],
    reports: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Report",
    }],
    image: {
        type: String,
    },
    blockedList: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    isOnline: {
        type: Boolean,
        default: false,
    },
    orderHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
    }],
    ratingAndReviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "RatingAndReview",
    }],

},{timestamps:true});


// export
const User = mongoose.model<IUser>("User",userSchema);
export default User;
