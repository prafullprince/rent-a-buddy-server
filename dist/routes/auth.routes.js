"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import express and make router instances
const express_1 = __importDefault(require("express"));
// router instances
const router = express_1.default.Router();
// import controllers
const auth_controllers_1 = require("../controllers/auth.controllers");
const auth_middleware_1 = require("../middleware/auth.middleware");
// routes
router.post('/login', auth_controllers_1.authenticate);
router.post('/getUser', auth_middleware_1.auth, auth_controllers_1.getUser);
// export router
exports.default = router;
