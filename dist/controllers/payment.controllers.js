"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMoney = exports.verifyPayments = exports.createOrder = void 0;
const apiResponse_helper_1 = require("../helper/apiResponse.helper");
const user_models_1 = __importDefault(require("../models/user.models"));
const razorpay_1 = require("../config/razorpay");
const crypto_1 = __importDefault(require("crypto"));
const wallet_models_1 = __importDefault(require("../models/wallet.models"));
const mongoose_1 = __importDefault(require("mongoose"));
const transaction_models_1 = __importDefault(require("../models/transaction.models"));
// createOrder -> Add money to user wallet
const createOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // fetch data
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { amount, minOrderAmount } = req.body;
        // validation
        if (!amount || !userId || amount < 200) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "All fields are required");
        }
        // check minOrder came 
        if (minOrderAmount) {
            if (amount < minOrderAmount) {
                return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "Amount should be greater than minimum order amount");
            }
        }
        // check if user exist
        const isUser = yield user_models_1.default.findOne({ _id: userId });
        if (!isUser) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 404, "User not found");
        }
        // createOrder
        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: Date.now().toString(),
            payment_capture: 1 // TODO
        };
        const paymentResponse = yield razorpay_1.instance.orders.create(options);
        return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "Order created successfully", paymentResponse);
    }
    catch (error) {
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal server error");
    }
});
exports.createOrder = createOrder;
// verifyPayments
const verifyPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    // initiate transaction
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        // fetch data
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const razorpay_order_id = (_b = req.body) === null || _b === void 0 ? void 0 : _b.razorpay_order_id;
        const razorpay_payment_id = (_c = req.body) === null || _c === void 0 ? void 0 : _c.razorpay_payment_id;
        const razorpay_signature = (_d = req.body) === null || _d === void 0 ? void 0 : _d.razorpay_signature;
        // validation
        if (!userId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            yield session.abortTransaction();
            session.endSession();
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "creadentails not found");
        }
        // make signature for client
        let body = razorpay_order_id + '|' + razorpay_payment_id;
        let expectedSignature = crypto_1.default
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');
        // check if signature is valid
        if (razorpay_signature !== expectedSignature) {
            yield session.abortTransaction();
            session.endSession();
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "Signature is invalid");
        }
        // find paymentDetails
        const paymentDetails = yield razorpay_1.instance.payments.fetch(razorpay_payment_id);
        if (!paymentDetails || paymentDetails.status !== "captured") {
            yield session.abortTransaction();
            session.endSession();
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "Payment not captured or invalid");
        }
        // amount
        const amount = Number(paymentDetails.amount) / 100; // Convert paise to rupees
        // payment verified - now add to wallet
        let wallet = yield wallet_models_1.default.findOne({ user: userId }).session(session);
        if (!wallet) {
            wallet = new wallet_models_1.default({ user: userId, balance: 0 });
        }
        wallet.balance = wallet.balance + amount;
        yield wallet.save();
        yield session.commitTransaction();
        session.endSession();
        return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "Payment verified successfully", null);
    }
    catch (error) {
        console.log(error);
        session.abortTransaction();
        session.endSession();
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal server error");
    }
});
exports.verifyPayments = verifyPayments;
// sendMoney
const sendMoney = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        // fetch data
        const senderId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { amount, receiverId } = req.body;
        // validation
        if (!amount || !senderId || !receiverId) {
            yield session.abortTransaction();
            session.endSession();
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "All fields are required");
        }
        // check if sender and receiver exist
        const [isSender, isReceiver] = yield Promise.all([user_models_1.default.findOne({ _id: senderId }).session(session), user_models_1.default.findOne({ _id: receiverId }).session(session)]);
        // validation
        if (!isSender || !isReceiver) {
            yield session.abortTransaction();
            session.endSession();
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "User does not exist");
        }
        // check if sender has enough balance
        const [senderWallet, receiverWallet] = yield Promise.all([wallet_models_1.default.findOne({ user: senderId }).session(session), wallet_models_1.default.findOne({ user: receiverId }).session(session)]);
        if (!senderWallet || senderWallet.balance < amount || !receiverWallet) {
            yield session.abortTransaction();
            session.endSession();
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "Insufficient balance/ wallet missing");
        }
        // update wallet pending
        receiverWallet.pending = receiverWallet.pending + amount;
        senderWallet.balance = senderWallet.balance - amount;
        // save wallet
        yield Promise.all([senderWallet.save({ session }), receiverWallet.save({ session })]);
        // create Transaction
        const transaction = new transaction_models_1.default({
            sender: senderId,
            receiver: receiverId,
            amount: amount,
            type: "Pending",
        });
        const data = yield transaction.save({ session });
        yield session.commitTransaction();
        session.endSession();
        // return res
        return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "Transaction successfull", data);
    }
    catch (error) {
        console.log(error);
        yield session.abortTransaction();
        session.endSession();
        return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "Error while creating order");
    }
});
exports.sendMoney = sendMoney;
// completeTransaction
// export const completeTransaction = async (req: Request, res: Response) => {
//     try {
//         // fetch data
//         const transactionId = req.body?.transactionId;
//         const userId = req.user?.id;
//         // validation
//         if (!transactionId || !userId) {
//             return ErrorResponse(res, 400, "All fields are required");
//         }
//         // check if transaction exist
//         const isTransaction = await Transaction.findOne({ _id: transactionId });
//         if (!isTransaction) {
//             return ErrorResponse(res, 404, "Transaction not found");
//         }
//         // check if user exist
//         const isUser = await User.findOne({ _id: userId });
//         if (!isUser) {
//             return ErrorResponse(res, 404, "User not found");
//         }
//         // check if transaction is pending
//         if (isTransaction.type !== "Pending") {
//             return ErrorResponse(res, 400, "Transaction is not pending");
//         }
//         // check if user has enough balance
//         const [userWallet] = await Promise.all([Wallet.findOne({ user: userId }).session(session)]);
//         if (!userWallet || userWallet.balance < isTransaction.amount) {
//             return ErrorResponse(res, 400, "Insufficient balance");
//         }
//         // update wallet
//         userWallet.balance = userWallet.balance - isTransaction.amount;
//         userWallet.pending = userWallet.pending - isTransaction.amount;
//         await userWallet.save();
//         // update transaction
//         isTransaction.type = "Complete";
//         await isTransaction.save();
//         return SuccessResponse(res, 200, "Transaction completed successfully", null);
//     } catch (error) {
//         return ErrorResponse(res, 500, "Internal server error");
//     }
// }
