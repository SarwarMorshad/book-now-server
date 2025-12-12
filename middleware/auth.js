import { verifyToken } from "../utils/generateToken.js";

// Verify JWT Token
export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    req.user = decoded; // Attach user info to request
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

// Check if user is Admin
export const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only.",
    });
  }
  next();
};

// Check if user is Vendor
export const isVendor = (req, res, next) => {
  if (req.user.role !== "vendor") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Vendor only.",
    });
  }
  next();
};

// Check if user is User (regular user)
export const isUser = (req, res, next) => {
  if (req.user.role !== "user") {
    return res.status(403).json({
      success: false,
      message: "Access denied. User only.",
    });
  }
  next();
};

// Check if user is Admin or Vendor
export const isAdminOrVendor = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "vendor") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin or Vendor only.",
    });
  }
  next();
};
