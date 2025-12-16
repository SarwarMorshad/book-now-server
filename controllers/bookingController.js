import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

// Create a new booking
// Create a new booking  for seat selection
export const createBooking = async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.userId;
    const { ticketId, quantity, selectedSeats } = req.body; // Added selectedSeats

    console.log("=== CREATE BOOKING ===");
    console.log("User ID from token:", userId);
    console.log("Ticket ID:", ticketId);
    console.log("Quantity:", quantity);
    console.log("Selected Seats:", selectedSeats);

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

    // If bus ticket with seat selection, check if seats are already booked
    if (ticket.transportType === "bus" && selectedSeats && selectedSeats.length > 0) {
      // Get all existing bookings for this ticket (not rejected)
      const existingBookings = await db
        .collection("bookings")
        .find({
          ticketId: new ObjectId(ticketId),
          status: { $ne: "rejected" },
          selectedSeats: { $exists: true },
        })
        .toArray();

      // Get all booked seats
      const bookedSeats = existingBookings.flatMap((b) => b.selectedSeats || []);

      // Check if any selected seat is already booked
      const conflictSeats = selectedSeats.filter((seat) => bookedSeats.includes(seat));
      if (conflictSeats.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Seats ${conflictSeats.join(", ")} are already booked. Please select different seats.`,
        });
      }
    }

    // Calculate total price
    const totalPrice = ticket.price * quantity;

    // Get user details
    const user = await db.collection("users").findOne({
      _id: new ObjectId(userId),
    });

    if (!user) {
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
      selectedSeats: selectedSeats || [], // Store selected seats
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

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
    res.status(500).json({
      success: false,
      message: "Failed to create booking",
      error: error.message,
    });
  }
};

// Get booked seats for a ticket
export const getBookedSeats = async (req, res) => {
  try {
    const db = getDB();
    const { ticketId } = req.params;

    // Get all bookings for this ticket (not rejected)
    const bookings = await db
      .collection("bookings")
      .find({
        ticketId: new ObjectId(ticketId),
        status: { $ne: "rejected" },
        selectedSeats: { $exists: true, $ne: [] },
      })
      .toArray();

    // Extract all booked seats
    const bookedSeats = bookings.flatMap((b) => b.selectedSeats || []);

    res.status(200).json({
      success: true,
      bookedSeats,
    });
  } catch (error) {
    console.error("Get booked seats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch booked seats",
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

// Cancel Booking (User can cancel only if status is "pending")
export const cancelBooking = async (req, res) => {
  try {
    const db = getDB();
    const { bookingId } = req.params;
    const userId = req.user.userId;

    console.log("=== CANCEL BOOKING ===");
    console.log("Booking ID:", bookingId);
    console.log("User ID:", userId);

    // Find the booking
    const booking = await db.collection("bookings").findOne({
      _id: new ObjectId(bookingId),
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if the user owns this booking
    if (booking.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own bookings",
      });
    }

    // Check if booking is still pending
    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel booking. Current status is "${booking.status}". You can only cancel pending bookings.`,
      });
    }

    // Delete the booking
    await db.collection("bookings").deleteOne({
      _id: new ObjectId(bookingId),
    });

    console.log("Booking cancelled successfully");

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel booking",
      error: error.message,
    });
  }
};
