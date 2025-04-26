import mongoose, { Schema } from "mongoose";

// interface
export interface IOrder {
    sender: mongoose.Types.ObjectId;
    receiver: mongoose.Types.ObjectId;
    event: mongoose.Types.ObjectId;
    date: string;
    time: string;
    location?: string;
    additionalInfo?: string;
    cabFare: number;
    totalPrice: number;
    chat: mongoose.Types.ObjectId;
    isActive: boolean;
    isCompleted: boolean;
    subId: mongoose.Types.ObjectId;
    unit: number;
    createdAt: Date;
    status: string;
}

// order schema
const orderSchema:Schema = new Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
    },
    date: {
        type: String,
    },
    time: {
        type: String,
    },
    location: {
        type: String,
    },
    additionalInfo: {
        type: String,
    },
    cabFare: {
        type: Number,
    },
    totalPrice: {
        type: Number,
    },
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
    },
    subId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory",
    },
    unit: {
        type: Number,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24 * 7,
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
    },
    isActive: {
        type: Boolean,
        default: false,
    },
    isCompleted: {
        type: Boolean,
        default: false,
    }
});

// export
const Order = mongoose.model<IOrder>("Order",orderSchema);
export default Order;
