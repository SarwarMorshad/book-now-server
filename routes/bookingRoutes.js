import express from "express";
import {
  createBooking,
  getUserBookings,
  getVendorBookingRequests,
  acceptBooking,
  rejectBooking,
  getBookingById,
} from "../controllers/bookingController.js";
import { authenticateToken, isUser, isVendor } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// User routes
router.post("/", isUser, createBooking);
router.get("/my-bookings", isUser, getUserBookings);

// Vendor routes
router.get("/vendor/requests", isVendor, getVendorBookingRequests);
router.patch("/:bookingId/accept", isVendor, acceptBooking);
router.patch("/:bookingId/reject", isVendor, rejectBooking);

// Common routes
router.get("/:bookingId", getBookingById);

export default router;
