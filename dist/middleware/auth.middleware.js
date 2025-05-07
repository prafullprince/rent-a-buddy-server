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
exports.isBuddy = exports.isAdmin = exports.isUser = exports.auth = void 0;
const apiResponse_helper_1 = require("../helper/apiResponse.helper");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// auth
const auth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // fetch token
        const token = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token) || ((_b = req.header("Authorization")) === null || _b === void 0 ? void 0 : _b.replace('Bearer ', ''));
        // validation
        if (!token) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 404, "Token not found");
        }
        // if found then decode and attach in user
        try {
            // decode            
            const decode = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            // if (typeof decode === "string") {
            //     return ErrorResponse(res,404,"Authorization failed");
            // }
            req.user = decode;
            next();
        }
        catch (error) {
            console.log(error);
            return (0, apiResponse_helper_1.ErrorResponse)(res, 404, "Authorization failed");
        }
    }
    catch (error) {
        console.log(error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal server error");
    }
});
exports.auth = auth;
// isUser
const isUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // fetch userId
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // validation
        if (!userId) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 404, "User not found");
        }
        // verify user role
        if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== "User") {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 403, "You are not authorized to access this resource");
        }
        next();
    }
    catch (error) {
        console.log(error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal server error");
    }
});
exports.isUser = isUser;
// isAdmin
const isAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // fetch userId
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // validation
        if (!userId) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 404, "User not found");
        }
        // verify user role
        if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== "Admin") {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 403, "You are not authorized to access this resource");
        }
        next();
    }
    catch (error) {
        console.log(error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal server error");
    }
});
exports.isAdmin = isAdmin;
// isBuddy
const isBuddy = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // fetch userId
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // validation
        if (!userId) {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 404, "User not found");
        }
        // verify user role
        if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== "Buddy") {
            return (0, apiResponse_helper_1.ErrorResponse)(res, 403, "You are not authorized to access this resource");
        }
        next();
    }
    catch (error) {
        console.log(error);
        return (0, apiResponse_helper_1.ErrorResponse)(res, 500, "Internal server error");
    }
});
exports.isBuddy = isBuddy;
