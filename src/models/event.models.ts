import mongoose, { Schema } from "mongoose";


export interface IEvent {
    availability: string;
    location: string;
    user: mongoose.Types.ObjectId;
    service: mongoose.Types.ObjectId;
    status: string;
    isActive: boolean;
    imageUrl: string;
}


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
    service: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
    }],
    status: {
        type: String,
        enum: ["Published","Draft"],
        default: "Draft"
    },
    isActive: {
        type: Boolean,
        default: true
    },
    imageUrl: {
        type: String,
    }
});

const Event = mongoose.model<IEvent>("Event",eventSchema);
export default Event;
