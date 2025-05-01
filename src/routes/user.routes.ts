// import express and make router instances
import express from 'express';
import { auth } from '../middleware/auth.middleware';
import { updateProfile, updateProfilePicture, userDetailsById } from '../controllers/user.controllers';
import { createPost, deletePostById, getPostsByUser } from '../controllers/post.controllers';

// router instances
const router = express.Router();

// import controllers


// routes
router.post('/updateProfile', auth, updateProfile);
router.post('/updateProfilePicture', auth, updateProfilePicture);
router.get('/userDetailsById', auth, userDetailsById);
router.post('/createPost', auth, createPost);
router.post('/deletePostById', auth, deletePostById);
router.post('/getPostsByUser', auth, getPostsByUser);

// export router
export default router;
