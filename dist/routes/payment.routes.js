"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import express and make router instances
const express_1 = __importDefault(require("express"));
const payment_controllers_1 = require("../controllers/payment.controllers");
const auth_middleware_1 = require("../middleware/auth.middleware");
// router instances
const router = express_1.default.Router();
// import controllers
// routes
router.post('/createOrder', auth_middleware_1.auth, payment_controllers_1.createOrder);
router.post('/verifyPayments', auth_middleware_1.auth, payment_controllers_1.verifyPayments);
router.post('/sendMoney', auth_middleware_1.auth, payment_controllers_1.sendMoney);
router.post('/getUserWallet', auth_middleware_1.auth, payment_controllers_1.getUserWallet);
// export router
exports.default = router;
