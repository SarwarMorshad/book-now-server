import { ObjectId } from "mongodb";
import { getCollections } from "../config/db.js";

// Add Ticket (Vendor only)
export const addTicket = async (req, res) => {
  try {
    const {
      title,
      fromLocation,
      toLocation,
      transportType,
      price,
      quantity,
      departureDate,
      departureTime,
      perks,
      imageUrl,
      vendorName,
      vendorEmail,
    } = req.body;

    // Validation
    if (
      !title ||
      !fromLocation ||
      !toLocation ||
      !transportType ||
      !price ||
      !quantity ||
      !departureDate ||
      !departureTime
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    const { tickets, users } = getCollections();

    // Check if vendor is marked as fraud
    const vendor = await users.findOne({ email: vendorEmail });
    if (vendor?.isFraud) {
      return res.status(403).json({
        success: false,
        message: "Fraudulent vendors cannot add tickets",
      });
    }

    const newTicket = {
      title,
      fromLocation,
      toLocation,
      transportType,
      price: parseFloat(price),
      quantity: parseInt(quantity),
      departureDate: new Date(departureDate),
      departureTime,
      perks: perks || [],
      imageUrl: imageUrl || "",
      vendorName,
      vendorEmail,
      verificationStatus: "pending",
      isAdvertised: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await tickets.insertOne(newTicket);

    res.status(201).json({
      success: true,
      message: "Ticket added successfully. Waiting for admin approval.",
      ticketId: result.insertedId,
    });
  } catch (error) {
    console.error("Add ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add ticket",
      error: error.message,
    });
  }
};

// Get All Tickets (Public - only approved)
export const getAllTickets = async (req, res) => {
  try {
    const { tickets } = getCollections();

    const allTickets = await tickets
      .find({ verificationStatus: "approved" })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      count: allTickets.length,
      tickets: allTickets,
    });
  } catch (error) {
    console.error("Get tickets error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tickets",
      error: error.message,
    });
  }
};

// Get Ticket by ID
export const getTicketById = async (req, res) => {
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

    res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("Get ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch ticket",
      error: error.message,
    });
  }
};

// Get Vendor's Tickets
export const getVendorTickets = async (req, res) => {
  try {
    const vendorEmail = req.user.email;
    const { tickets } = getCollections();

    const vendorTickets = await tickets.find({ vendorEmail }).sort({ createdAt: -1 }).toArray();

    res.status(200).json({
      success: true,
      count: vendorTickets.length,
      tickets: vendorTickets,
    });
  } catch (error) {
    console.error("Get vendor tickets error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vendor tickets",
      error: error.message,
    });
  }
};

// Update Ticket (Vendor only - own tickets)
export const updateTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const vendorEmail = req.user.email;
    const updateData = req.body;

    const { tickets } = getCollections();

    // Check if ticket exists and belongs to vendor
    const ticket = await tickets.findOne({ _id: new ObjectId(ticketId) });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (ticket.vendorEmail !== vendorEmail) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own tickets",
      });
    }

    if (ticket.verificationStatus === "rejected") {
      return res.status(403).json({
        success: false,
        message: "Cannot update rejected tickets",
      });
    }

    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.vendorEmail;
    delete updateData.vendorName;
    delete updateData.verificationStatus;
    delete updateData.isAdvertised;

    const result = await tickets.updateOne(
      { _id: new ObjectId(ticketId) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
    });
  } catch (error) {
    console.error("Update ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update ticket",
      error: error.message,
    });
  }
};

// Delete Ticket (Vendor only - own tickets)
export const deleteTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const vendorEmail = req.user.email;

    const { tickets } = getCollections();

    // Check if ticket exists and belongs to vendor
    const ticket = await tickets.findOne({ _id: new ObjectId(ticketId) });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (ticket.vendorEmail !== vendorEmail) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own tickets",
      });
    }

    if (ticket.verificationStatus === "rejected") {
      return res.status(403).json({
        success: false,
        message: "Cannot delete rejected tickets",
      });
    }

    await tickets.deleteOne({ _id: new ObjectId(ticketId) });

    res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error("Delete ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete ticket",
      error: error.message,
    });
  }
};

// Get Latest Tickets (for homepage)
export const getLatestTickets = async (req, res) => {
  try {
    const { tickets } = getCollections();

    const latestTickets = await tickets
      .find({ verificationStatus: "approved" })
      .sort({ createdAt: -1 })
      .limit(8)
      .toArray();

    res.status(200).json({
      success: true,
      count: latestTickets.length,
      tickets: latestTickets,
    });
  } catch (error) {
    console.error("Get latest tickets error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch latest tickets",
      error: error.message,
    });
  }
};

// Get Advertised Tickets (for homepage)
export const getAdvertisedTickets = async (req, res) => {
  try {
    const { tickets } = getCollections();

    const advertisedTickets = await tickets
      .find({
        verificationStatus: "approved",
        isAdvertised: true,
      })
      .limit(6)
      .toArray();

    res.status(200).json({
      success: true,
      count: advertisedTickets.length,
      tickets: advertisedTickets,
    });
  } catch (error) {
    console.error("Get advertised tickets error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch advertised tickets",
      error: error.message,
    });
  }
};
