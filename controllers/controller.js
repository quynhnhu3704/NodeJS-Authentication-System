
//update lan nua:
import mongoose from "mongoose";
import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import { transporter } from "../config/nodemailerConfig.js";
import { generateToken, verifyToken } from "../config/token.js";
import dotenv from "dotenv";

dotenv.config();

export class UserGetController {
    getSignUpPage = (req, res) => {
        res.render("signup", { message: "" });
    };

    getSignInPage = (req, res) => {
        res.render("signin", { message: "" });
    };

    homePage = (req, res) => {
        const token = req.session.token;
        if (!token) {
            return res.status(401).render("signin", { message: "Please sign in to view the homepage" });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).render("signin", { message: "Session expired, please sign in again" });
        }

        res.render("homepage", { studentInfo: "22656871 - Nguyễn Thái An" });
    };

    getForgotPassword = (req, res) => {
        res.render("forgot-password", { message: "" });
    };

    getChangePassword = (req, res) => {
        const token = req.session.token;
        if (!token || !verifyToken(token)) {
            return res.status(401).render("signin", { message: "Please sign in to change the password" });
        }
        res.render("change-password", { message: "" });
    };

    logoutUser = (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error("Error signing out:", err);
                res.status(500).send("Error signing out");
            } else {
                res.status(201).render("signin", { message: "User logout" });
            }
        });
    };
}

export class UserPostController {
    createUser = async (req, res) => {
        const { username, email, password, cpassword } = req.body;
        const recaptcha = req.body["g-recaptcha-response"];

        if (!recaptcha) {
            return res.status(404).render("signup", { message: "Please select captcha" });
        }

        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptcha}`;
        const captchaResponse = await fetch(verificationURL, { method: 'POST' });
        const captchaData = await captchaResponse.json();

        if (!captchaData.success) {
            return res.status(400).render("signup", { message: "Captcha verification failed" });
        }

        if (password !== cpassword) {
            return res.status(400).render("signup", { message: "Passwords don't match" });
        }
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).render("signup", { message: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        try {
            await newUser.save();
            res.status(201).render("signin", { message: "User created successfully" });
        } catch (error) {
            res.status(409).json({ message: error.message });
        }
    };

    signInUser = async (req, res) => {
        const { email, password } = req.body;
        const recaptcha = req.body["g-recaptcha-response"];

        if (!recaptcha) {
            return res.status(404).render("signin", { message: "Please select captcha" });
        }

        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptcha}`;
        const captchaResponse = await fetch(verificationURL, { method: 'POST' });
        const captchaData = await captchaResponse.json();

        if (!captchaData.success) {
            return res.status(400).render("signin", { message: "Captcha verification failed" });
        }

        try {
            const existingUser = await User.findOne({ email: email });
            if (!existingUser) return res.status(404).render("signin", { message: "User doesn't exist" });

            const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
            if (!isPasswordCorrect)
                return res.status(400).render("signin", { message: "Invalid credentials || Incorrect Password" });

            const token = generateToken(email);
            req.session.token = token;
            req.session.userEmail = email;

            res.redirect("/user/homepage");
        } catch (error) {
            res.status(500).render("signin", { message: error.message });
        }
    };

    forgotPassword = async (req, res) => {
        const { email } = req.body;
        const recaptcha = req.body["g-recaptcha-response"];

        if (!recaptcha) {
            return res.status(404).render("forgot-password", { message: "Please select captcha" });
        }

        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptcha}`;
        const captchaResponse = await fetch(verificationURL, { method: 'POST' });
        const captchaData = await captchaResponse.json();

        if (!captchaData.success) {
            return res.status(400).render("forgot-password", { message: "Captcha verification failed" });
        }

        try {
            const existingUser = await User.findOne({ email: email });
            if (!existingUser)
                return res.status(404).render("forgot-password", { message: "User doesn't exist" });

            const newPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            try {
                await transporter.sendMail({
                    from: process.env.EMAIL,
                    to: email,
                    subject: "Password Reset",
                    text: `Your new password is: ${newPassword}`,
                });
            } catch (error) {
                console.log(error);
                return res.status(404).render("forgot-password", { message: "Not valid Email: " + error.message });
            }

            existingUser.password = hashedPassword;
            await existingUser.save();

            res.status(201).render("signin", { message: "New Password sent to your email" });
        } catch (error) {
            res.status(500).render("forgot-password", { message: error.message });
        }
    };

    changePassword = async (req, res) => {
        const { oldPassword, newPassword } = req.body;
        const recaptcha = req.body["g-recaptcha-response"];

        if (!recaptcha) {
            return res.status(404).render("change-password", { message: "Please select captcha" });
        }

        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptcha}`;
        const captchaResponse = await fetch(verificationURL, { method: 'POST' });
        const captchaData = await captchaResponse.json();

        if (!captchaData.success) {
            return res.status(400).render("change-password", { message: "Captcha verification failed" });
        }

        try {
            const email = req.session.userEmail;
            const existingUser = await User.findOne({ email: email });
            if (!existingUser)
                return res.status(404).render("change-password", { message: "User doesn't exist" });

            const isPasswordCorrect = await bcrypt.compare(oldPassword, existingUser.password);
            if (!isPasswordCorrect)
                return res.status(400).render("change-password", { message: "Invalid credentials" });

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            existingUser.password = hashedPassword;
            await existingUser.save();

            res.status(201).render("signin", { message: "Password changed successfully" });
        } catch (error) {
            res.status(500).render("change-password", { message: error.message });
        }
    };
}