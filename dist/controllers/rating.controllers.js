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
exports.createRating = void 0;
const apiResponse_helper_1 = require("../helper/apiResponse.helper");
const rating_models_1 = __importDefault(require("../models/rating.models"));
const user_models_1 = __importDefault(require("../models/user.models"));
// createRating
const createRating = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // fetch data
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { user, rating, review } = req.body;
        // check isUser already rated by this user
        const isUser = yield user_models_1.default.findOne({ _id: user });
        if ((_b = isUser === null || isUser === void 0 ? void 0 : isUser.ratingAndReviews) === null || _b === void 0 ? void 0 : _b.find((ratingAndReview) => ratingAndReview.user === userId)) {
            return res.status(409).json({ message: "User already rated by this user" });
        }
        // if not then save in db
        const data = yield rating_models_1.default.create({
            user: userId,
            rating: rating,
            review: review,
        });
        // update user
        const updatedUser = yield user_models_1.default.findByIdAndUpdate({ _id: userId }, {
            $push: {
                ratingAndReviews: data._id
            }
        }, { new: true });
        return (0, apiResponse_helper_1.SuccessResponse)(res, 201, "Ratings created", data);
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.createRating = createRating;
