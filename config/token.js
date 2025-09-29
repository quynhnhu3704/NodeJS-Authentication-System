//update:
// config/token.js
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key"; // Lấy từ .env, fallback nếu không có

// Tạo token khi login
export const generateToken = (email) => {
  return jwt.sign({ email }, SECRET_KEY, { expiresIn: "1h" }); // Token hết hạn sau 1h
};

// Verify token (dùng trong middleware)
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (err) {
    return null; // Nếu sai hoặc hết hạn
  }
};