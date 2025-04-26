import { Request, Response } from "express";
import { ErrorResponse, SuccessResponse } from "../helper/apiResponse.helper";
import User from "../models/user.models";
import { instance } from "../config/razorpay";
import crypto from "crypto";
import Wallet from "../models/wallet.models";
import mongoose from "mongoose";
import Transaction from "../models/transaction.models";
import Order from "../models/order.models";

// createOrder -> Add money to user wallet
export const createOrder = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    // fetch data
    const userId = req.user?.id;
    const { amount, minOrderAmount } = req.body;
    console.log("amount", amount);
    // validation
    if (!amount || !userId || amount < 200) {
      return ErrorResponse(
        res,
        400,
        "All fields are required and minimum 200 rupees"
      );
    }

    // check minOrder came
    if (minOrderAmount) {
      if (amount < minOrderAmount) {
        return ErrorResponse(
          res,
          400,
          "Amount should be greater than minimum order amount"
        );
      }
    }

    // check if user exist
    const isUser = await User.findOne({ _id: userId });
    if (!isUser) {
      return ErrorResponse(res, 404, "User not found");
    }

    // createOrder
    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: Date.now().toString(),
      payment_capture: 1, // TODO
    };

    const paymentResponse = await instance.orders.create(options);

    return SuccessResponse(
      res,
      200,
      "Order created successfully",
      paymentResponse
    );
  } catch (error) {
    return ErrorResponse(res, 500, "Internal server error");
  }
};

// verifyPayments
export const verifyPayments = async (
  req: Request,
  res: Response
): Promise<any> => {
  // initiate transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // fetch data
    const userId = req.user?.id;
    const razorpay_order_id = req.body?.razorpay_order_id;
    const razorpay_payment_id = req.body?.razorpay_payment_id;
    const razorpay_signature = req.body?.razorpay_signature;

    // validation
    if (
      !userId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      await session.abortTransaction();
      session.endSession();
      return ErrorResponse(res, 400, "creadentails not found");
    }

    // make signature for client
    let body = razorpay_order_id + "|" + razorpay_payment_id;
    let expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    // check if signature is valid
    if (razorpay_signature !== expectedSignature) {
      await session.abortTransaction();
      session.endSession();
      return ErrorResponse(res, 400, "Signature is invalid");
    }

    // find paymentDetails
    const paymentDetails = await instance.payments.fetch(razorpay_payment_id);
    if (!paymentDetails || paymentDetails.status !== "captured") {
      await session.abortTransaction();
      session.endSession();
      return ErrorResponse(res, 400, "Payment not captured or invalid");
    }

    // amount
    const amount: any = Number(paymentDetails.amount) / 100; // Convert paise to rupees

    // payment verified - now add to wallet
    let wallet = await Wallet.findOne({ user: userId }).session(session);
    if (!wallet) {
      wallet = new Wallet({ user: userId, balance: 0 });
    }

    wallet.balance = wallet.balance + amount;
    await wallet.save();

    await session.commitTransaction();
    session.endSession();

    return SuccessResponse(res, 200, "Payment verified successfully", null);
  } catch (error) {
    console.log(error);
    session.abortTransaction();
    session.endSession();
    return ErrorResponse(res, 500, "Internal server error");
  }
};

// sendMoney
export const sendMoney = async (req: Request, res: Response): Promise<any> => {
  const session = await mongoose.startSession();

  try {
    const data = await session.withTransaction(async () => {
      // fetch data
      const senderId = req.user?.id;
      const { amount, receiverId, orderId } = req.body;

      // validation
      if (!amount || !senderId || !receiverId) {
        throw new Error("All fields are required");
      }

      // check if sender and receiver exist
      const [isSender, isReceiver] = await Promise.all([
        User.findOne({ _id: senderId }).session(session),
        User.findOne({ _id: receiverId }).session(session),
      ]);

      if (!isSender || !isReceiver) {
        throw new Error("User does not exist");
      }

      // check if sender has enough balance
      const [senderWallet, receiverWallet] = await Promise.all([
        Wallet.findOne({ user: senderId }).session(session),
        Wallet.findOne({ user: receiverId }).session(session),
      ]);

      if (!senderWallet || senderWallet.balance < amount || !receiverWallet) {
        throw new Error("Insufficient balance or wallet missing");
      }

      // update balances
      senderWallet.balance -= amount;
      receiverWallet.pending += amount;

      await Promise.all([
        senderWallet.save({ session }),
        receiverWallet.save({ session }),
      ]);

      // create Transaction
      const transaction = new Transaction({
        sender: senderId,
        receiver: receiverId,
        amount,
        type: "Pending",
      });

      // update order status
      await Order.findByIdAndUpdate(orderId, { $set: { isActive: true } }, { session });

      return await transaction.save({ session });
    });

    // Always end session
    session.endSession();

    return SuccessResponse(res, 200, "Transaction successful", data);
  } catch (error: any) {
    console.error("sendMoney error:", error.message || error);
    session.endSession();
    return ErrorResponse(res, 400, error.message || "Error while processing transaction");
  }
};

// getUserWallet
export const getUserWallet = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user?.id;
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return ErrorResponse(res, 404, "Wallet not found");
    }

    return SuccessResponse(res, 200, "Wallet found", wallet);
  } catch (error) {
    console.log(error);
    return ErrorResponse(res, 500, "Internal server error");
  }
};
