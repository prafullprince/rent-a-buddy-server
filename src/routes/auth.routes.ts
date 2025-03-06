// import express and make router instances
import express from 'express';

// router instances
const router = express.Router();

// import controllers
import { authenticate, getUser } from '../controllers/auth.controllers';
import { auth } from '../middleware/auth.middleware';

// routes
router.post('/login', authenticate);
router.get('/getUser',auth,getUser);

// export router
export default router;
