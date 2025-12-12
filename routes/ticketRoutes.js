import express from "express";
import {
  addTicket,
  getAllTickets,
  getTicketById,
  getVendorTickets,
  updateTicket,
  deleteTicket,
  getLatestTickets,
  getAdvertisedTickets,
} from "../controllers/ticketController.js";
import { authenticateToken, isVendor } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/", getAllTickets);
router.get("/latest", getLatestTickets);
router.get("/advertised", getAdvertisedTickets);
router.get("/:ticketId", getTicketById);

// Protected routes - Vendor only
router.post("/", authenticateToken, isVendor, addTicket);
router.get("/vendor/my-tickets", authenticateToken, isVendor, getVendorTickets);
router.patch("/:ticketId", authenticateToken, isVendor, updateTicket);
router.delete("/:ticketId", authenticateToken, isVendor, deleteTicket);

export default router;
