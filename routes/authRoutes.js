import express from "express";
import { registerOrLoginUser, getUserProfile } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Public Routes
router.post("/register-or-login", registerOrLoginUser);

// Protected Routes
router.get("/profile", authenticateToken, getUserProfile);

export default router;
