
//lam them:
import express from 'express';
import { UserGetController, UserPostController } from '../controllers/controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const UserGetControllerInstance = new UserGetController();
const UserPostControllerInstance = new UserPostController();

// GET REQUESTS
router.get('/signup', UserGetControllerInstance.getSignUpPage);
router.get('/signin', UserGetControllerInstance.getSignInPage);

// ✅ Bảo vệ bằng token
router.get('/homepage', authMiddleware, UserGetControllerInstance.homePage);
router.get('/change-password', authMiddleware, UserGetControllerInstance.getChangePassword);

router.get('/signout', UserGetControllerInstance.logoutUser);
router.get('/forgot-password', UserGetControllerInstance.getForgotPassword);

// POST REQUESTS
router.post('/signup', UserPostControllerInstance.createUser);
router.post('/signin', UserPostControllerInstance.signInUser);
router.post('/forgot-password', UserPostControllerInstance.forgotPassword);
router.post('/change-password', UserPostControllerInstance.changePassword);

export default router;