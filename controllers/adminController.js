import { ObjectId } from "mongodb";
import { getCollections } from "../config/db.js";

// ==========================================
// TICKET MANAGEMENT (Already exists)
// ==========================================

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
          isAdvertised: false,
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

    const ticket = await tickets.findOne({ _id: new ObjectId(ticketId) });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (ticket.verificationStatus !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved tickets can be advertised",
      });
    }

    const newAdvertisedStatus = !ticket.isAdvertised;

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

// ==========================================
// USER MANAGEMENT (New functions)
// ==========================================

// Get All Users
export const getAllUsers = async (req, res) => {
  try {
    const { users } = getCollections();

    const allUsers = await users
      .find({}, { projection: { firebaseUid: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      users: allUsers,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// Update User Role
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const { users } = getCollections();

    // Validate role
    if (!["user", "vendor", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be user, vendor, or admin",
      });
    }

    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          role,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
    });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update role",
      error: error.message,
    });
  }
};

// Mark Vendor as Fraud
export const markAsFraud = async (req, res) => {
  try {
    const { userId } = req.params;
    const { users, tickets } = getCollections();

    // Get user
    const user = await users.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "vendor") {
      return res.status(400).json({
        success: false,
        message: "Only vendors can be marked as fraud",
      });
    }

    // Mark user as fraud
    await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          isFraud: true,
          updatedAt: new Date(),
        },
      }
    );

    // Hide all tickets by this vendor
    await tickets.updateMany(
      { vendorEmail: user.email },
      {
        $set: {
          isHidden: true,
          updatedAt: new Date(),
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Vendor marked as fraud. All their tickets are now hidden.",
    });
  } catch (error) {
    console.error("Mark as fraud error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark as fraud",
      error: error.message,
    });
  }
};

// Remove Fraud Status
export const removeFraudStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { users, tickets } = getCollections();

    const user = await users.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Remove fraud status
    await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          isFraud: false,
          updatedAt: new Date(),
        },
      }
    );

    // Unhide tickets
    await tickets.updateMany(
      { vendorEmail: user.email },
      {
        $set: {
          isHidden: false,
          updatedAt: new Date(),
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Fraud status removed. Tickets are now visible.",
    });
  } catch (error) {
    console.error("Remove fraud status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove fraud status",
      error: error.message,
    });
  }
};

// ==========================================
// BOOKINGS MANAGEMENT (New function)
// ==========================================

// Get All Bookings (Admin)
export const getAllBookings = async (req, res) => {
  try {
    const { bookings, tickets, users } = getCollections();

    const allBookings = await bookings.find({}).sort({ createdAt: -1 }).toArray();

    // Populate ticket and user info
    const populatedBookings = await Promise.all(
      allBookings.map(async (booking) => {
        const ticket = await tickets.findOne({ _id: booking.ticketId });
        const user = await users.findOne({ _id: booking.userId }, { projection: { firebaseUid: 0 } });

        return {
          ...booking,
          ticket,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                email: user.email,
                photoURL: user.photoURL,
              }
            : null,
        };
      })
    );

    res.status(200).json({
      success: true,
      bookings: populatedBookings,
    });
  } catch (error) {
    console.error("Get all bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
};
