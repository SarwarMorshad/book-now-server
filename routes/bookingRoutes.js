import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createBooking,
  getUserBookings,
  getBookingById,
  getVendorBookings,
  acceptBooking,
  rejectBooking,
  cancelBooking,
  getBookedSeats,
} from "../controllers/bookingController.js";

const router = express.Router();

// Static routes FIRST (most specific)
router.post("/", authenticate, createBooking);
router.get("/my-bookings", authenticate, getUserBookings);
router.get("/seats/:ticketId", authenticate, getBookedSeats);
router.get("/vendor/requests", authenticate, getVendorBookings);

// Dynamic routes LAST (least specific)
router.get("/:bookingId", authenticate, getBookingById);
router.patch("/:bookingId/accept", authenticate, acceptBooking);
router.patch("/:bookingId/reject", authenticate, rejectBooking);
router.patch("/:bookingId/cancel", authenticate, cancelBooking);

export default router;
