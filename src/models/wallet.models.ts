// import
import mongoose, { Schema } from "mongoose";
import { IWallet } from "../types/schema/walletSchema.types";


// schema
const walletSchema:Schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
      ref: "Transaction",
    }],
});


// export
const Wallet = mongoose.model<IWallet>("Wallet",walletSchema);
export default Wallet;



















// // import
// import mongoose, { Schema } from "mongoose";



// // schema
// const userSchema:Schema = new Schema({
    
// });


// // export
// const User = mongoose.model<any>("User",userSchema);
// export default User;
