import mongoose, { Schema } from "mongoose";
import { IEvent } from "../types/schema/eventSchema.types";


const eventSchema = new Schema({
    availability:{
        type:String,
        required:true
    },
    location:{
        type:String,
        required:true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    sections: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section",
    }],
    status: {
        type: String,
        enum: ["Published","Draft"],
        default: "Draft"
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

const Event = mongoose.model<IEvent>("Event",eventSchema);
export default Event;
