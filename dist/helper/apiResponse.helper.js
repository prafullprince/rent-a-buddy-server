"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuccessResponse = exports.ErrorResponse = void 0;
const ErrorResponse = (res, status, message) => {
    return res.status(status).json({
        success: false,
        message: message
    });
};
exports.ErrorResponse = ErrorResponse;
const SuccessResponse = (res, status, message, data) => {
    return res.status(status).json({
        success: true,
        message: message,
        data
    });
};
exports.SuccessResponse = SuccessResponse;
