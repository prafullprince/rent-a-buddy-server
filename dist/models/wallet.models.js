"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// import
const mongoose_1 = __importStar(require("mongoose"));
// schema
const walletSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    balance: {
        type: Number,
        default: 0,
        required: true,
    },
    pending: {
        type: Number,
        default: 0,
        required: true,
    },
    referrelBalance: {
        type: Number,
        default: 0,
        required: true,
    },
    transactions: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Transaction",
        }],
});
// export
const Wallet = mongoose_1.default.model("Wallet", walletSchema);
exports.default = Wallet;
// // import
// import mongoose, { Schema } from "mongoose";
// // schema
// const userSchema:Schema = new Schema({
// });
// // export
// const User = mongoose.model<any>("User",userSchema);
// export default User;
