import express from "express";
import {
  createPaymentIntent,
  confirmPayment,
  getUserTransactions,
} from "../controllers/paymentController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.post("/create-payment-intent", authenticate, createPaymentIntent);
router.post("/confirm-payment", authenticate, confirmPayment);
router.get("/transactions", authenticate, getUserTransactions);

export default router;
