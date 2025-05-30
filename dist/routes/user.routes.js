"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import express and make router instances
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_controllers_1 = require("../controllers/user.controllers");
const post_controllers_1 = require("../controllers/post.controllers");
// router instances
const router = express_1.default.Router();
// import controllers
// routes
router.post('/updateProfile', auth_middleware_1.auth, user_controllers_1.updateProfile);
router.post('/updateProfilePicture', auth_middleware_1.auth, user_controllers_1.updateProfilePicture);
router.get('/userDetailsById', auth_middleware_1.auth, user_controllers_1.userDetailsById);
router.post('/createPost', auth_middleware_1.auth, post_controllers_1.createPost);
router.post('/deletePostById', auth_middleware_1.auth, post_controllers_1.deletePostById);
router.post('/getPostsByUser', auth_middleware_1.auth, post_controllers_1.getPostsByUser);
// export router
exports.default = router;
