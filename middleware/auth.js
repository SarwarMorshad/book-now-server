import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId || decoded.id, // ← Support both for backward compatibility
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

// Export as authenticateToken for compatibility
export const authenticateToken = authenticate;

// Check if user is admin
export const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only.",
    });
  }
  next();
};

// Check if user is vendor
export const isVendor = (req, res, next) => {
  if (req.user.role !== "vendor") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Vendor only.",
    });
  }
  next();
};

// Check if user is regular user
export const isUser = (req, res, next) => {
  if (req.user.role !== "user") {
    return res.status(403).json({
      success: false,
      message: "Access denied. User only.",
    });
  }
  next();
};

// Authorize multiple roles
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(", ")}`,
      });
    }
    next();
  };
};
