import express from "express";
import {
  getAllUsers,
  updateUserRole,
  markVendorAsFraud,
  getUserById,
} from "../controllers/userController.js";
import { authenticateToken, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Admin only routes
router.get("/", isAdmin, getAllUsers);
router.get("/:userId", getUserById);
router.patch("/:userId/role", isAdmin, updateUserRole);
router.patch("/:vendorId/fraud", isAdmin, markVendorAsFraud);

export default router;
