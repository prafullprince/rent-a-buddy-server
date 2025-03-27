// import express and make router instances
import express from 'express';

// router instances
const router = express.Router();

// import controllers
import { createCategory, createSubCategory, fetchCategoryAndSubCategory } from '../controllers/category.controllers';

// routes
router.post('/createCategory', createCategory);
router.post('/createSubCategory', createSubCategory);
router.get('/fetchCategorySubCategory', fetchCategoryAndSubCategory);

// export router
export default router;
