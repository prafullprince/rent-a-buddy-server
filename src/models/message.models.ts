import mongoose, { Schema } from "mongoose";

// interface
export interface IMessage {
    sender: mongoose.Types.ObjectId;
    receiver: mongoose.Types.ObjectId;
    text: string;
    chatId: mongoose.Types.ObjectId;
}

// chat schema
const messageSchema:Schema = new Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    text: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
    },
    isSeen: {
        type: Boolean,
        default: false,
    },
    type: {
        type: String,
        enum: ["text", "order"],
        default: "text",
    }
},{timestamps:true});

// export
const Message = mongoose.model<IMessage>("Message",messageSchema);
export default Message;
