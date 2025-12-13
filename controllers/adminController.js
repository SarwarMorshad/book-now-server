import { ObjectId } from "mongodb";
import { getCollections } from "../config/db.js";

// Get All Tickets (Admin - including pending)
export const getAllTicketsAdmin = async (req, res) => {
  try {
    const { tickets } = getCollections();

    const allTickets = await tickets.find({}).sort({ createdAt: -1 }).toArray();

    res.status(200).json({
      success: true,
      count: allTickets.length,
      tickets: allTickets,
    });
  } catch (error) {
    console.error("Get all tickets error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tickets",
      error: error.message,
    });
  }
};

// Approve Ticket
export const approveTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { tickets } = getCollections();

    const result = await tickets.updateOne(
      { _id: new ObjectId(ticketId) },
      {
        $set: {
          verificationStatus: "approved",
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ticket approved successfully",
    });
  } catch (error) {
    console.error("Approve ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve ticket",
      error: error.message,
    });
  }
};

// Reject Ticket
export const rejectTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { tickets } = getCollections();

    const result = await tickets.updateOne(
      { _id: new ObjectId(ticketId) },
      {
        $set: {
          verificationStatus: "rejected",
          isAdvertised: false, // Remove from advertisement if rejected
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ticket rejected successfully",
    });
  } catch (error) {
    console.error("Reject ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject ticket",
      error: error.message,
    });
  }
};

// Toggle Advertisement Status
export const toggleAdvertisement = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { tickets } = getCollections();

    // Get current ticket
    const ticket = await tickets.findOne({ _id: new ObjectId(ticketId) });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Check if ticket is approved
    if (ticket.verificationStatus !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved tickets can be advertised",
      });
    }

    const newAdvertisedStatus = !ticket.isAdvertised;

    // If trying to advertise, check if already have 6 advertised tickets
    if (newAdvertisedStatus) {
      const advertisedCount = await tickets.countDocuments({
        isAdvertised: true,
      });

      if (advertisedCount >= 6) {
        return res.status(400).json({
          success: false,
          message: "Maximum 6 tickets can be advertised at a time",
        });
      }
    }

    // Toggle advertisement status
    await tickets.updateOne(
      { _id: new ObjectId(ticketId) },
      {
        $set: {
          isAdvertised: newAdvertisedStatus,
          updatedAt: new Date(),
        },
      }
    );

    res.status(200).json({
      success: true,
      message: newAdvertisedStatus ? "Ticket advertised successfully" : "Ticket removed from advertisement",
      isAdvertised: newAdvertisedStatus,
    });
  } catch (error) {
    console.error("Toggle advertisement error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle advertisement",
      error: error.message,
    });
  }
};
