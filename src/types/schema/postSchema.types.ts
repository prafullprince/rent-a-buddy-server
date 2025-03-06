import mongoose from "mongoose";

export interface IPost {
    user: mongoose.Types.ObjectId;
    imageUrl: string;
}
