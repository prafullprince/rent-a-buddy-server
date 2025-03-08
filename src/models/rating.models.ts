import mongoose, { Schema } from "mongoose";
import { IEvent } from "../types/schema/eventSchema.types";
import { IRating } from "../types/schema/ratingSchema.types";


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

