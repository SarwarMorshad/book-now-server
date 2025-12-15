import express from "express";
import {
  createBooking,
  getUserBookings,
  getBookingById,
  getVendorBookings,
  acceptBooking,
  rejectBooking,
} from "../controllers/bookingController.js";
import { authenticate, isVendor } from "../middleware/auth.js";

const router = express.Router();

// User routes
router.post("/", authenticate, createBooking);
router.get("/my-bookings", authenticate, getUserBookings);

// Vendor routes - MUST be BEFORE /:bookingId
router.get("/vendor", authenticate, isVendor, getVendorBookings);
router.patch("/:bookingId/accept", authenticate, isVendor, acceptBooking);
router.patch("/:bookingId/reject", authenticate, isVendor, rejectBooking);

// Dynamic route - MUST be LAST
router.get("/:bookingId", authenticate, getBookingById);

export default router;
