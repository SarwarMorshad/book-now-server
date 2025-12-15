import express from "express";
import {
  createPaymentIntent,
  confirmPayment,
  getUserTransactions,
} from "../controllers/paymentController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Create payment intent
router.post("/create-payment-intent", authenticateToken, createPaymentIntent);

// Confirm payment - Support both routes
router.post("/confirm", authenticateToken, confirmPayment);
router.post("/confirm-payment", authenticateToken, confirmPayment);

// Get user transactions
router.get("/transactions", authenticateToken, getUserTransactions);

export default router;
