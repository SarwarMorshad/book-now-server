import express from "express";
import { registerOrLoginUser, updateUserProfile } from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.post("/register-or-login", registerOrLoginUser);
router.patch("/update-profile", authenticate, updateUserProfile);

export default router;
