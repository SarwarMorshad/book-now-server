import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

// Create a new booking
export const createBooking = async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.userId;
    const { ticketId, quantity } = req.body;

    console.log("=== CREATE BOOKING ===");
    console.log("User ID from token:", userId);
    console.log("Ticket ID:", ticketId);
    console.log("Quantity:", quantity);

    // Validate required fields
    if (!ticketId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Ticket ID and quantity are required",
      });
    }

    // Get ticket details
    const ticket = await db.collection("tickets").findOne({
      _id: new ObjectId(ticketId),
    });

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
        message: "This ticket is not available for booking",
      });
    }

    // Check if enough seats available
    if (ticket.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: "Not enough seats available",
      });
    }

    // Calculate total price
    const totalPrice = ticket.price * quantity;

    // Get user details - with proper error handling
    const user = await db.collection("users").findOne({
      _id: new ObjectId(userId),
    });

    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      console.error("User not found for ID:", userId);
      return res.status(404).json({
        success: false,
        message: "User not found. Please logout and login again.",
      });
    }

    // Create booking document
    const booking = {
      userId: new ObjectId(userId),
      ticketId: new ObjectId(ticketId),
      quantity,
      totalPrice,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("Creating booking...");

    // Insert booking
    const result = await db.collection("bookings").insertOne(booking);

    console.log("Booking created successfully with ID:", result.insertedId);

    // Prepare response with populated data
    const createdBooking = {
      ...booking,
      _id: result.insertedId,
      ticket: ticket,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL || "",
      },
    };

    res.status(201).json({
      success: true,
      message: "Booking created successfully. Waiting for vendor approval.",
      booking: createdBooking,
    });
  } catch (error) {
    console.error("Create booking error:", error);
    console.error("Error details:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create booking",
      error: error.message,
    });
  }
};

// Get user's bookings
export const getUserBookings = async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.userId;

    // Get all bookings for this user
    const bookings = await db
      .collection("bookings")
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    // Populate ticket and user details for each booking
    const populatedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const ticket = await db.collection("tickets").findOne({
          _id: booking.ticketId,
        });

        const user = await db.collection("users").findOne({
          _id: booking.userId,
        });

        return {
          ...booking,
          ticket,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                email: user.email,
                photoURL: user.photoURL || "",
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
    console.error("Get user bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
};

// Get booking by ID
export const getBookingById = async (req, res) => {
  try {
    const db = getDB();
    const { bookingId } = req.params;

    const booking = await db.collection("bookings").findOne({
      _id: new ObjectId(bookingId),
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Populate ticket and user
    const ticket = await db.collection("tickets").findOne({
      _id: booking.ticketId,
    });

    const user = await db.collection("users").findOne({
      _id: booking.userId,
    });

    const populatedBooking = {
      ...booking,
      ticket,
      user: user
        ? {
            _id: user._id,
            name: user.name,
            email: user.email,
            photoURL: user.photoURL || "",
          }
        : null,
    };

    res.status(200).json({
      success: true,
      booking: populatedBooking,
    });
  } catch (error) {
    console.error("Get booking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
      error: error.message,
    });
  }
};

// Get vendor's bookings
export const getVendorBookings = async (req, res) => {
  try {
    const db = getDB();
    const vendorEmail = req.user.email;

    // Find all tickets by this vendor
    const vendorTickets = await db.collection("tickets").find({ vendorEmail }).toArray();

    const ticketIds = vendorTickets.map((ticket) => ticket._id);

    // Find all bookings for these tickets
    const bookings = await db
      .collection("bookings")
      .find({ ticketId: { $in: ticketIds } })
      .sort({ createdAt: -1 })
      .toArray();

    // Populate ticket and user details
    const populatedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const ticket = await db.collection("tickets").findOne({
          _id: booking.ticketId,
        });

        const user = await db.collection("users").findOne({
          _id: booking.userId,
        });

        return {
          ...booking,
          ticket,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                email: user.email,
                photoURL: user.photoURL || "",
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
    console.error("Get vendor bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vendor bookings",
      error: error.message,
    });
  }
};

// Accept booking (vendor only)
export const acceptBooking = async (req, res) => {
  try {
    const db = getDB();
    const { bookingId } = req.params;
    const vendorEmail = req.user.email;

    // Find booking
    const booking = await db.collection("bookings").findOne({
      _id: new ObjectId(bookingId),
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Get ticket
    const ticket = await db.collection("tickets").findOne({
      _id: booking.ticketId,
    });

    // Check if vendor owns this ticket
    if (ticket.vendorEmail !== vendorEmail) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to accept this booking",
      });
    }

    // Check if booking is pending
    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending bookings can be accepted",
      });
    }

    // Update booking status
    await db.collection("bookings").updateOne(
      { _id: new ObjectId(bookingId) },
      {
        $set: {
          status: "accepted",
          updatedAt: new Date(),
        },
      }
    );

    // Get updated booking with populated data
    const updatedBooking = await db.collection("bookings").findOne({
      _id: new ObjectId(bookingId),
    });

    const user = await db.collection("users").findOne({
      _id: updatedBooking.userId,
    });

    const populatedBooking = {
      ...updatedBooking,
      ticket,
      user: user
        ? {
            _id: user._id,
            name: user.name,
            email: user.email,
            photoURL: user.photoURL || "",
          }
        : null,
    };

    res.status(200).json({
      success: true,
      message: "Booking accepted successfully",
      booking: populatedBooking,
    });
  } catch (error) {
    console.error("Accept booking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to accept booking",
      error: error.message,
    });
  }
};

// Reject booking (vendor only)
export const rejectBooking = async (req, res) => {
  try {
    const db = getDB();
    const { bookingId } = req.params;
    const vendorEmail = req.user.email;

    // Find booking
    const booking = await db.collection("bookings").findOne({
      _id: new ObjectId(bookingId),
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Get ticket
    const ticket = await db.collection("tickets").findOne({
      _id: booking.ticketId,
    });

    // Check if vendor owns this ticket
    if (ticket.vendorEmail !== vendorEmail) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to reject this booking",
      });
    }

    // Check if booking is pending
    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending bookings can be rejected",
      });
    }

    // Update booking status
    await db.collection("bookings").updateOne(
      { _id: new ObjectId(bookingId) },
      {
        $set: {
          status: "rejected",
          updatedAt: new Date(),
        },
      }
    );

    // Get updated booking with populated data
    const updatedBooking = await db.collection("bookings").findOne({
      _id: new ObjectId(bookingId),
    });

    const user = await db.collection("users").findOne({
      _id: updatedBooking.userId,
    });

    const populatedBooking = {
      ...updatedBooking,
      ticket,
      user: user
        ? {
            _id: user._id,
            name: user.name,
            email: user.email,
            photoURL: user.photoURL || "",
          }
        : null,
    };

    res.status(200).json({
      success: true,
      message: "Booking rejected",
      booking: populatedBooking,
    });
  } catch (error) {
    console.error("Reject booking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject booking",
      error: error.message,
    });
  }
};
