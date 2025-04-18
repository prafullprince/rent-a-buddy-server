// import express and make router instances
import express from 'express';


// router instances
const router = express.Router();

// import controllers
import { auth, isBuddy } from '../middleware/auth.middleware';
import { fetchAllMessages, fetchChat, fetchOrderHistory, fetchOtherUser, requestOrder } from '../controllers/order.controllers';

// routes
router.post('/createOrder', auth, isBuddy , requestOrder);
router.post('/fetchChat', auth, fetchChat);
router.post('/fetchAllMessages', auth, fetchAllMessages);
router.post('/fetchOrderHistory', auth, fetchOrderHistory);
router.post('/fetchOtherUser', fetchOtherUser);

// export router
export default router;
