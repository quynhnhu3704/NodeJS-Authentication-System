//update: làm thử
import passport from 'passport';
import express from 'express';
import dotenv from 'dotenv';
import { googleSignInController } from '../controllers/authController.js';
import { generateToken } from '../config/token.js';

dotenv.config();

const authRouter = express.Router();
const googleSignIn = new googleSignInController();

// OAuth2 login with Google
authRouter.get(
  "/google",
  passport.authenticate('google', { scope: ['email', 'profile'] })
);

// Google OAuth2 callback
authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: "/auth/login/success",
    failureRedirect: "/auth/login/failed",
  })
);

// Login success → tạo token
authRouter.get("/login/success", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: true, message: "Not Authorized" });
  }

  const { email } = req.user._json;
  if (!email) {
    return res.status(403).json({ error: true, message: "No email from Google" });
  }

  // ✅ Tạo token
  const token = generateToken(email);
  req.session.token = token;

  return googleSignIn.signInSuccess(req, res);
});

// Login failed
authRouter.get("/login/failed", googleSignIn.signInFailed);

export default authRouter;
