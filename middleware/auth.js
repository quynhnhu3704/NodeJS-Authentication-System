// middleware/auth.js
import { verifyToken } from "../config/token.js";

export const authMiddleware = (req, res, next) => {
  // token có thể được lưu trong session hoặc cookie — check cả 2
  const token = (req.session && req.session.token) || (req.cookies && req.cookies.token);

  if (!token) {
    return res.status(401).render("signin", { message: "Please sign in to continue" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    // nếu token hết hạn / không hợp lệ -> xoá token trong session nếu cần
    if (req.session) {
      req.session.token = null;
    }
    return res.status(403).render("signin", { message: "Session expired. Please sign in again" });
  }

  // lưu email từ token cho controller dùng
  req.userEmail = decoded.email;
  next();
};