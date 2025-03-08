import mongoose, { Schema } from "mongoose";


const transactionSchema = new Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true, 
    },
    amount: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        enum: ["Pending", "Complete", "Refund"],
        required: true,
    },
});

const Transaction = mongoose.model<any>("Transaction", transactionSchema);
export default Transaction;
