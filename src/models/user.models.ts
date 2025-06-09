// import
import mongoose, { Schema } from "mongoose";

// interface
export interface IUser {
    username: string;
    email: string;
    password: string;
    lastLogin: Date;
    provider: string[];
    role: string;
    favourite: mongoose.Types.ObjectId[];
    chats: mongoose.Types.ObjectId[];
    notifications: mongoose.Types.ObjectId[];
    profile: mongoose.Types.ObjectId;
    wallet: mongoose.Types.ObjectId;
    isVerified: boolean;
    refunds: mongoose.Types.ObjectId[];
    earnings: mongoose.Types.ObjectId[];
    posts: mongoose.Types.ObjectId[];
    events: mongoose.Types.ObjectId[];
    reports: mongoose.Types.ObjectId[];
    image: string;
    blockedList: mongoose.Types.ObjectId[];
    following: mongoose.Types.ObjectId[];
    followers: mongoose.Types.ObjectId[];
    isOnline: boolean;
    orderHistory: mongoose.Types.ObjectId[];
    ratingAndReviews: mongoose.Types.ObjectId[];
    ethnicity: string;
    phoneNumber: string;
}

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
        default: "Buddy",
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
    ethnicity: {
        type: String,
        enum: ["Indian", "Pakistani", "Bangladeshi", "Chinese", "Other"],
        default: "Indian",
    },
    phoneNumber: {
        type: String,
    },

},{timestamps:true});


// export
const User = mongoose.model<IUser>("User",userSchema);
export default User;
