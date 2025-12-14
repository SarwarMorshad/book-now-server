import express from "express";
import {
  createBooking,
  getUserBookings,
  getBookingById,
  getVendorBookings,
  acceptBooking,
  rejectBooking,
} from "../controllers/bookingController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// User routes
router.post("/", authenticate, createBooking);
router.get("/my-bookings", authenticate, getUserBookings);
router.get("/:bookingId", authenticate, getBookingById);

// Vendor routes
router.get("/vendor/my-bookings", authenticate, getVendorBookings);
router.patch("/:bookingId/accept", authenticate, acceptBooking);
router.patch("/:bookingId/reject", authenticate, rejectBooking);

export default router;
