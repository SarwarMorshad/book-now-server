import { ObjectId } from "mongodb";
import { getCollections } from "../config/db.js";

// Add New Ticket (Vendor)
export const addTicket = async (req, res) => {
  try {
    const { tickets } = getCollections();
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
    } = req.body;

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
      vendorName: req.user.name || "Vendor",
      vendorEmail: req.user.email,
      verificationStatus: "pending",
      isAdvertised: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await tickets.insertOne(newTicket);
    newTicket._id = result.insertedId;

    res.status(201).json({
      success: true,
      message: "Ticket added successfully. Waiting for admin approval.",
      ticket: newTicket,
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

// Get All Approved Tickets (Public)
// Get All Approved Tickets (Public)
export const getAllTickets = async (req, res) => {
  try {
    const { tickets, users } = getCollections();
    const { from, to, transportType, sort } = req.query;

    // Get fraud vendor emails
    const fraudVendors = await users.find({ isFraud: true }).project({ email: 1 }).toArray();
    const fraudEmails = fraudVendors.map((v) => v.email);

    // Build filter - exclude hidden and fraud vendor tickets
    const filter = {
      verificationStatus: "approved",
      $or: [{ isHidden: { $exists: false } }, { isHidden: false }],
    };

    // Exclude fraud vendor tickets
    if (fraudEmails.length > 0) {
      filter.vendorEmail = { $nin: fraudEmails };
    }

    if (from) {
      filter.fromLocation = { $regex: from, $options: "i" };
    }

    if (to) {
      filter.toLocation = { $regex: to, $options: "i" };
    }

    if (transportType) {
      filter.transportType = transportType;
    }

    // Build sort
    let sortOption = { createdAt: -1 };
    if (sort === "price-low") {
      sortOption = { price: 1 };
    } else if (sort === "price-high") {
      sortOption = { price: -1 };
    } else if (sort === "date") {
      sortOption = { departureDate: 1 };
    }

    const allTickets = await tickets.find(filter).sort(sortOption).toArray();

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

// Get Single Ticket by ID (Public)
export const getTicketById = async (req, res) => {
  try {
    const { tickets } = getCollections();
    const { ticketId } = req.params;

    if (!ObjectId.isValid(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

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
    console.error("Get ticket by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch ticket",
      error: error.message,
    });
  }
};

// Get Vendor's Own Tickets
export const getVendorTickets = async (req, res) => {
  try {
    const { tickets } = getCollections();
    const vendorEmail = req.user.email;

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

// Update Ticket (Vendor)
export const updateTicket = async (req, res) => {
  try {
    const { tickets } = getCollections();
    const { ticketId } = req.params;
    const vendorEmail = req.user.email;

    if (!ObjectId.isValid(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    // Check if ticket belongs to vendor
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
        message: "Not authorized to update this ticket",
      });
    }

    // Check if ticket is rejected
    if (ticket.verificationStatus === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Cannot update rejected ticket",
      });
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date(),
    };

    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.vendorEmail;
    delete updateData.vendorName;
    delete updateData.verificationStatus;
    delete updateData.isAdvertised;

    const result = await tickets.updateOne({ _id: new ObjectId(ticketId) }, { $set: updateData });

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "No changes made",
      });
    }

    const updatedTicket = await tickets.findOne({ _id: new ObjectId(ticketId) });

    res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      ticket: updatedTicket,
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

// Delete Ticket (Vendor)
export const deleteTicket = async (req, res) => {
  try {
    const { tickets } = getCollections();
    const { ticketId } = req.params;
    const vendorEmail = req.user.email;

    if (!ObjectId.isValid(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    // Check if ticket belongs to vendor
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
        message: "Not authorized to delete this ticket",
      });
    }

    // Check if ticket is rejected
    if (ticket.verificationStatus === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete rejected ticket",
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

// Get Advertised Tickets (Max 6) - Public
export const getAdvertisedTickets = async (req, res) => {
  try {
    const { tickets } = getCollections();

    const advertisedTickets = await tickets
      .find({
        verificationStatus: "approved",
        isAdvertised: true,
      })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();

    res.status(200).json({
      success: true,
      tickets: advertisedTickets,
    });
  } catch (error) {
    console.error("Get advertised tickets error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch advertised tickets",
    });
  }
};

// Get Latest Tickets (Max 8) - Public
export const getLatestTickets = async (req, res) => {
  try {
    const { tickets } = getCollections();

    const latestTickets = await tickets
      .find({
        verificationStatus: "approved",
      })
      .sort({ createdAt: -1 })
      .limit(8)
      .toArray();

    res.status(200).json({
      success: true,
      tickets: latestTickets,
    });
  } catch (error) {
    console.error("Get latest tickets error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch latest tickets",
    });
  }
};
