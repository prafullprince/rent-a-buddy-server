import mongoose, { Schema } from "mongoose";

// 
export interface IService { 
    userId: mongoose.Types.ObjectId;
    eventId: mongoose.Types.ObjectId;
    sections: mongoose.Types.ObjectId[];
}

const serviceSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
    },
    sections: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section",
    }],
});

const Service = mongoose.model<IService>("Service", serviceSchema);
export default Service;
