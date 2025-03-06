import mongoose from "mongoose";

export interface IWallet {
    user: mongoose.Types.ObjectId;
    balance: number;
    pending: number;
    referrelBalance: number;
    transactions?: mongoose.Types.ObjectId[];
}
