// import express and make router instances
import express from 'express';
import { createOrder, getUserWallet, sendMoney, verifyPayments } from '../controllers/payment.controllers';
import { auth } from '../middleware/auth.middleware';

// router instances
const router = express.Router();

// import controllers


// routes
router.post('/createOrder', auth, createOrder);
router.post('/verifyPayments', auth, verifyPayments);
router.post('/sendMoney', auth,sendMoney);
router.post('/getUserWallet', auth, getUserWallet);

// export router
export default router;
