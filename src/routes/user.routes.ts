// import express and make router instances
import express from 'express';
import { auth } from '../middleware/auth.middleware';
import { updateProfile, updateProfilePicture, userDetailsById } from '../controllers/user.controllers';

// router instances
const router = express.Router();

// import controllers


// routes
router.post('/updateProfile', auth, updateProfile);
router.post('/updateProfilePicture', auth, updateProfilePicture);
router.get('/userDetailsById', auth, userDetailsById);

// export router
export default router;
