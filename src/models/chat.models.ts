import mongoose, { Schema } from "mongoose";

// interface
export interface IChat {
    participants: mongoose.Types.ObjectId[];
    message: mongoose.Types.ObjectId[];
}

// chat schema
const chatSchema:Schema = new Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    message: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
    }]
});

// export
const Chat = mongoose.model<IChat>("Chat",chatSchema);
export default Chat;
