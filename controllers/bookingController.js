import { ObjectId } from "mongodb";
import { getCollections } from "../config/db.js";

// Create Booking (User only)
export const createBooking = async (req, res) => {
  try {
    const {
      ticketId,
      ticketTitle,
      ticketImage,
      vendorEmail,
      bookingQuantity,
      unitPrice,
      fromLocation,
      toLocation,
      departureDate,
      departureTime,
    } = req.body;

    const userId = req.user.id;
    const userEmail = req.user.email;

    // Validation
    if (!ticketId || !bookingQuantity) {
      return res.status(400).json({
        success: false,
        message: "Ticket ID and booking quantity are required",
      });
    }

    const { bookings, tickets, users } = getCollections();

    // Get ticket details
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
        message: "Ticket is not available for booking",
      });
    }

    // Check if departure date has passed
    const now = new Date();
    const departure = new Date(ticket.departureDate);
    if (departure < now) {
      return res.status(400).json({
        success: false,
        message: "Cannot book tickets for past dates",
      });
    }

    // Check ticket availability
    if (ticket.quantity < bookingQuantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${ticket.quantity} tickets available`,
      });
    }

    // Get user details
    const user = await users.findOne({ _id: new ObjectId(userId) });

    const totalPrice = unitPrice * bookingQuantity;

    const newBooking = {
      ticketId: new ObjectId(ticketId),
      ticketTitle: ticketTitle || ticket.title,
      ticketImage: ticketImage || ticket.imageUrl,
      userId: new ObjectId(userId),
      userEmail: userEmail,
      userName: user?.name || "User",
      vendorEmail: vendorEmail || ticket.vendorEmail,
      bookingQuantity: parseInt(bookingQuantity),
      unitPrice: parseFloat(unitPrice),
      totalPrice: parseFloat(totalPrice),
      fromLocation: fromLocation || ticket.fromLocation,
      toLocation: toLocation || ticket.toLocation,
      departureDate: new Date(departureDate || ticket.departureDate),
      departureTime: departureTime || ticket.departureTime,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await bookings.insertOne(newBooking);

    res.status(201).json({
      success: true,
      message: "Booking request submitted successfully",
      bookingId: result.insertedId,
      booking: newBooking,
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

// Get User's Bookings
export const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookings } = getCollections();

    const userBookings = await bookings
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      count: userBookings.length,
      bookings: userBookings,
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

// Get Vendor's Booking Requests
export const getVendorBookingRequests = async (req, res) => {
  try {
    const vendorEmail = req.user.email;
    const { bookings } = getCollections();

    const vendorBookings = await bookings.find({ vendorEmail }).sort({ createdAt: -1 }).toArray();

    res.status(200).json({
      success: true,
      count: vendorBookings.length,
      bookings: vendorBookings,
    });
  } catch (error) {
    console.error("Get vendor bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking requests",
      error: error.message,
    });
  }
};

// Accept Booking (Vendor only)
export const acceptBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const vendorEmail = req.user.email;

    const { bookings } = getCollections();

    // Check if booking exists and belongs to vendor
    const booking = await bookings.findOne({ _id: new ObjectId(bookingId) });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.vendorEmail !== vendorEmail) {
      return res.status(403).json({
        success: false,
        message: "You can only manage your own bookings",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Booking is already ${booking.status}`,
      });
    }

    // Update booking status to accepted
    await bookings.updateOne(
      { _id: new ObjectId(bookingId) },
      {
        $set: {
          status: "accepted",
          updatedAt: new Date(),
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Booking accepted successfully",
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

// Reject Booking (Vendor only)
export const rejectBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const vendorEmail = req.user.email;

    const { bookings } = getCollections();

    // Check if booking exists and belongs to vendor
    const booking = await bookings.findOne({ _id: new ObjectId(bookingId) });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.vendorEmail !== vendorEmail) {
      return res.status(403).json({
        success: false,
        message: "You can only manage your own bookings",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Booking is already ${booking.status}`,
      });
    }

    // Update booking status to rejected
    await bookings.updateOne(
      { _id: new ObjectId(bookingId) },
      {
        $set: {
          status: "rejected",
          updatedAt: new Date(),
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Booking rejected successfully",
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

// Get Booking by ID
export const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { bookings } = getCollections();

    const booking = await bookings.findOne({ _id: new ObjectId(bookingId) });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      booking,
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
