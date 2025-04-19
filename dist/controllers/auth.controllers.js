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
exports.getUser = exports.authenticate = void 0;
const apiResponse_helper_1 = require("../helper/apiResponse.helper");
const user_models_1 = __importDefault(require("../models/user.models"));
const wallet_models_1 = __importDefault(require("../models/wallet.models"));
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// authenticate
const authenticate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // start transaction
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        // fetch data
        const { user } = req.body;
        // validation
        if (!user) {
            yield session.abortTransaction();
            session.endSession();
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "user is required");
        }
        // check if user exists
        const isUser = yield user_models_1.default.findOne({ email: user.email });
        // if user exists - update lastlogin
        if (isUser) {
            isUser.lastLogin = new Date();
            yield isUser.save({ session });
            // token
            const token = jsonwebtoken_1.default.sign({ id: isUser === null || isUser === void 0 ? void 0 : isUser._id, email: isUser.email, role: isUser.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
            yield session.commitTransaction();
            session.endSession();
            return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "user authenticated successfully", token);
        }
        // if user doesn't exist - create user
        const newUser = new user_models_1.default({
            email: user.email,
            username: user.email.split("@")[0],
            lastLogin: new Date(),
            role: "User",
            isVerified: false,
            image: user.image,
        });
        // save user
        yield newUser.save({ session });
        // now create wallet
        const newWallet = new wallet_models_1.default({
            user: newUser._id,
            balance: 0,
            referrelBalance: 0,
            pending: 0,
        });
        // save wallet
        yield newWallet.save({ session });
        // updateUserWithWallet
        newUser.wallet = newWallet._id;
        yield newUser.save({ session });
        // token
        const token = jsonwebtoken_1.default.sign({ id: newUser === null || newUser === void 0 ? void 0 : newUser._id, email: newUser.email, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
        // commit transaction
        yield session.commitTransaction();
        session.endSession();
        return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "User loggedin", token);
    }
    catch (error) {
        console.log("authenticate internal server error", error);
        yield session.abortTransaction();
        session.endSession();
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "authenticate internal server error");
    }
});
exports.authenticate = authenticate;
// fetchUserDetails
const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        console.log("userId", userId);
        const data = yield user_models_1.default.findOne({ _id: userId }).select("_id");
        console.log("data", data);
        return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "fetched", data);
    }
    catch (error) {
        console.log(error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Error in server");
    }
});
exports.getUser = getUser;
