import mongoose, { Schema } from "mongoose";

export interface IRating {
    rating: number;
    reviews: string;
    user: mongoose.Types.ObjectId;
}

const ratingSchema = new Schema({
    rating: {
        type:Number,
        required:true
    },
    reviews: {
        type:String,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }
});

const Rating = mongoose.model<IRating>("Rating",ratingSchema);
export default Rating;

