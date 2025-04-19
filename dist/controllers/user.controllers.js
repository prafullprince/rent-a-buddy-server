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
exports.userDetailsById = exports.updateProfile = exports.updateProfilePicture = void 0;
const apiResponse_helper_1 = require("../helper/apiResponse.helper");
const user_models_1 = __importDefault(require("../models/user.models"));
const mediaUpload_helper_1 = require("../helper/mediaUpload.helper");
// updateProfilePicture
const updateProfilePicture = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // fetch data
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const thumbnail = (_b = req.files) === null || _b === void 0 ? void 0 : _b.thumbnail;
        // validation
        if (!userId || !thumbnail) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "All fields are required");
        }
        // check if user exist
        const isUser = yield user_models_1.default.findOne({ _id: userId });
        if (!isUser) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 404, "User not found");
        }
        // upload thumbnail
        const thumbnailImage = yield (0, mediaUpload_helper_1.thumbnailToCloudinary)(thumbnail, process.env.FOLDER_NAME);
        if (!thumbnailImage) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 404, "upload failed");
        }
        // update profile picture
        isUser.image = thumbnailImage.secure_url;
        const data = yield isUser.save();
        // return res
        return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "Profile picture updated successfully", data);
    }
    catch (error) {
        console.log(error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal server error");
    }
});
exports.updateProfilePicture = updateProfilePicture;
// aadhaar verification
// updateProfile
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // fetch data
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const updates = req.body;
        // validation
        if (!userId) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "All fields are required");
        }
        // check if user exist
        const isUser = yield user_models_1.default.findOne({ _id: userId });
        if (!isUser) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 404, "User not found");
        }
        // update user
        for (const key in updates) {
            if (updates.hasOwnProperty(key)) {
                isUser[key] = updates[key];
            }
        }
        const data = yield isUser.save();
        return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "Profile updated", data);
    }
    catch (error) {
        console.log(error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal server error");
    }
});
exports.updateProfile = updateProfile;
// userDetailsById
const userDetailsById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // fetch data
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // validation
        if (!userId) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 400, "All fields are required");
        }
        // fetch user
        const user = yield user_models_1.default.findById(userId)
            .select("_id username image phoneNumber");
        // return res
        return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "User fetched successfully", user);
    }
    catch (error) {
        console.log(error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal server error");
    }
});
exports.userDetailsById = userDetailsById;
