import express from "express";
import {
  getAllTicketsAdmin,
  approveTicket,
  rejectTicket,
  toggleAdvertisement,
  getAllUsers,
  updateUserRole,
  markAsFraud,
  removeFraudStatus,
  getAllBookings,
} from "../controllers/adminController.js";
import { authenticateToken, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(isAdmin);

// Ticket management
router.get("/tickets", getAllTicketsAdmin);
router.patch("/tickets/:ticketId/approve", approveTicket);
router.patch("/tickets/:ticketId/reject", rejectTicket);
router.patch("/tickets/:ticketId/advertise", toggleAdvertisement);

// User management
router.get("/users", getAllUsers);
router.patch("/users/:userId/role", updateUserRole);
router.patch("/users/:userId/fraud", markAsFraud);
router.patch("/users/:userId/remove-fraud", removeFraudStatus);

// Bookings management
router.get("/bookings", getAllBookings);

export default router;
