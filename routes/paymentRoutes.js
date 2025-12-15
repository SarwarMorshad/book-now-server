import express from "express";
import {
  createPaymentIntent,
  confirmPayment,
  getUserTransactions,
} from "../controllers/paymentController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Create payment intent
router.post("/create-payment-intent", authenticate, createPaymentIntent);

// Confirm payment
router.post("/confirm", authenticate, confirmPayment);

// Get user transactions
router.get("/transactions", authenticate, getUserTransactions);

export default router;
