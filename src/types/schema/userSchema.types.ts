import mongoose from "mongoose";

export interface IUser {
    username?: string;
    email: string;
    lastLogin?: Date;
    password?: string;
    provider?: string[];
    role?: string;
    favourite?: mongoose.Types.ObjectId[];
    chats?: mongoose.Types.ObjectId[];
    notifications?: mongoose.Types.ObjectId[];
    profile?: mongoose.Types.ObjectId;
    wallet: mongoose.Types.ObjectId;
    isVerified?: boolean;
    refunds?: mongoose.Types.ObjectId[];
    earnings?: mongoose.Types.ObjectId[];
    posts?: mongoose.Types.ObjectId[];
    events?: mongoose.Types.ObjectId[];
    reports?: mongoose.Types.ObjectId[];
    image?: string;
    blockedList?: mongoose.Types.ObjectId[];
    following?: mongoose.Types.ObjectId[];
    followers?: mongoose.Types.ObjectId[];
    isOnline?: boolean;
    orderHistory?: mongoose.Types.ObjectId[];   
}
