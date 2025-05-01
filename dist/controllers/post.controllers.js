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
exports.deletePostById = exports.getPostsByUser = exports.createPost = void 0;
const post_models_1 = __importDefault(require("../models/post.models"));
const mediaUpload_helper_1 = require("../helper/mediaUpload.helper");
const user_models_1 = __importDefault(require("../models/user.models"));
const apiResponse_helper_1 = require("../helper/apiResponse.helper");
const mongoose_1 = __importDefault(require("mongoose"));
// create post
const createPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // fetch data
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const userIds = new mongoose_1.default.Types.ObjectId(userId);
        console.log(userIds);
        if (!userIds) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // check user present
        const isUser = yield user_models_1.default.findById(userIds);
        if (!isUser) {
            return res.status(404).json({ message: "User not found" });
        }
        if (isUser.posts.length >= 10) {
            return res.status(400).json({ message: "You can not create more than 10 posts" });
        }
        // find thumbnail
        const thumbnail = (_b = req.files) === null || _b === void 0 ? void 0 : _b.imageUrl;
        if (!thumbnail) {
            return res.status(400).json({ message: "Thumbnail not found" });
        }
        // upload on cloudinary
        const thumbnailImage = yield (0, mediaUpload_helper_1.thumbnailToCloudinary)(thumbnail, process.env.FOLDER_NAME);
        if (!thumbnailImage) {
            return res.status(400).json({ message: "Thumbnail not uploaded" });
        }
        // create post
        const data = yield post_models_1.default.create({
            user: userId,
            imageUrl: thumbnailImage.secure_url,
        });
        // update user
        yield user_models_1.default.findByIdAndUpdate({ _id: isUser._id }, {
            $push: {
                posts: data._id,
            },
        }, { new: true });
        return (0, apiResponse_helper_1.SuccessResponse)(res, 201, "Post created successfully", data);
    }
    catch (error) {
        console.log(error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal Server Error");
    }
});
exports.createPost = createPost;
// get posts by user
const getPostsByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.body.userId;
        const userIds = new mongoose_1.default.Types.ObjectId(userId);
        if (!userIds) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // check user present
        const isUser = yield user_models_1.default.findById(userIds);
        if (!isUser) {
            return res.status(404).json({ message: "User not found" });
        }
        // get posts -> max 10 posts
        const data = yield user_models_1.default.findById(userId).select("_id posts").populate("posts").limit(10);
        return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "Posts fetched successfully", data);
    }
    catch (error) {
        console.log(error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal Server Error");
    }
});
exports.getPostsByUser = getPostsByUser;
// delete post by id
const deletePostById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // fetch data
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const postId = req.body.postId;
        // validation
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!postId) {
            return res.status(400).json({ message: "Post id not found" });
        }
        // verify post exist by this user
        const [isPost, isUser] = yield Promise.all([
            post_models_1.default.findById(postId),
            user_models_1.default.findById(userId)
        ]);
        if (!isPost) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (!isUser) {
            return res.status(404).json({ message: "User not found" });
        }
        // delete post
        const data = yield post_models_1.default.findByIdAndDelete(isPost._id);
        // update user
        yield user_models_1.default.findByIdAndUpdate({ _id: isUser._id }, {
            $pull: {
                posts: data === null || data === void 0 ? void 0 : data._id,
            },
        }, { new: true });
        return (0, apiResponse_helper_1.SuccessResponse)(res, 200, "Post deleted successfully", null);
    }
    catch (error) {
        console.log(error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal Server Error");
    }
});
exports.deletePostById = deletePostById;
