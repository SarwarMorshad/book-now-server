import express from "express";
import {
  createPaymentIntent,
  confirmPayment,
  getUserTransactions,
  getVendorRevenue,
} from "../controllers/paymentController.js";
import { authenticateToken, isUser, isVendor } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// User payment routes
router.post("/create-payment-intent", isUser, createPaymentIntent);
router.post("/confirm-payment", isUser, confirmPayment);
router.get("/transactions", isUser, getUserTransactions);

// Vendor revenue routes
router.get("/vendor/revenue", isVendor, getVendorRevenue);

export default router;
