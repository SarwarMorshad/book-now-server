import express from "express";
import {
  getAllTicketsAdmin,
  approveTicket,
  rejectTicket,
  toggleAdvertisement,
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

export default router;
