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
const category_controllers_1 = require("../controllers/category.controllers");
// routes
router.post('/createCategory', category_controllers_1.createCategory);
router.post('/createSubCategory', category_controllers_1.createSubCategory);
router.get('/fetchCategorySubCategory', category_controllers_1.fetchCategoryAndSubCategory);
// export router
exports.default = router;
