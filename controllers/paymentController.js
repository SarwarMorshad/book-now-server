import Stripe from "stripe";
import { ObjectId } from "mongodb";
import { getCollections } from "../config/db.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Payment Intent
export const createPaymentIntent = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user.id;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const { bookings } = getCollections();

    // Get booking details
    const booking = await bookings.findOne({ _id: new ObjectId(bookingId) });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if booking belongs to user
    if (booking.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to booking",
      });
    }

    // Check if booking is accepted
    if (booking.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Booking must be accepted by vendor before payment",
      });
    }

    // Check if departure date has passed
    const now = new Date();
    const departure = new Date(booking.departureDate);
    if (departure < now) {
      return res.status(400).json({
        success: false,
        message: "Cannot make payment for past dates",
      });
    }

    // Check if already paid
    if (booking.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Booking is already paid",
      });
    }

    // Create Stripe payment intent
    const amount = Math.round(booking.totalPrice * 100); // Convert to cents

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: {
        bookingId: bookingId,
        userId: userId,
        ticketTitle: booking.ticketTitle,
      },
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount: booking.totalPrice,
    });
  } catch (error) {
    console.error("Create payment intent error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment intent",
      error: error.message,
    });
  }
};

// Confirm Payment
export const confirmPayment = async (req, res) => {
  try {
    const { bookingId, paymentIntentId } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    if (!bookingId || !paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID and Payment Intent ID are required",
      });
    }

    const { bookings, tickets, transactions } = getCollections();

    // Get booking details
    const booking = await bookings.findOne({ _id: new ObjectId(bookingId) });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
      });
    }

    // Update booking status to paid
    await bookings.updateOne(
      { _id: new ObjectId(bookingId) },
      {
        $set: {
          status: "paid",
          updatedAt: new Date(),
        },
      }
    );

    // Reduce ticket quantity
    await tickets.updateOne(
      { _id: booking.ticketId },
      {
        $inc: { quantity: -booking.bookingQuantity },
        $set: { updatedAt: new Date() },
      }
    );

    // Create transaction record
    const transaction = {
      bookingId: new ObjectId(bookingId),
      userId: new ObjectId(userId),
      userEmail: userEmail,
      ticketTitle: booking.ticketTitle,
      amount: booking.totalPrice,
      transactionId: paymentIntentId,
      paymentDate: new Date(),
      createdAt: new Date(),
    };

    await transactions.insertOne(transaction);

    res.status(200).json({
      success: true,
      message: "Payment confirmed successfully",
      transaction,
    });
  } catch (error) {
    console.error("Confirm payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm payment",
      error: error.message,
    });
  }
};

// Get User's Transaction History
export const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { transactions } = getCollections();

    const userTransactions = await transactions
      .find({ userId: new ObjectId(userId) })
      .sort({ paymentDate: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      count: userTransactions.length,
      transactions: userTransactions,
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
      error: error.message,
    });
  }
};

// Get Vendor Revenue Overview
export const getVendorRevenue = async (req, res) => {
  try {
    const vendorEmail = req.user.email;
    const { bookings, tickets } = getCollections();

    // Get all paid bookings for vendor
    const paidBookings = await bookings
      .find({
        vendorEmail,
        status: "paid",
      })
      .toArray();

    // Calculate total revenue
    const totalRevenue = paidBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);

    // Calculate total tickets sold
    const totalTicketsSold = paidBookings.reduce((sum, booking) => sum + booking.bookingQuantity, 0);

    // Get total tickets added by vendor
    const vendorTickets = await tickets.countDocuments({ vendorEmail });

    res.status(200).json({
      success: true,
      revenue: {
        totalRevenue: totalRevenue.toFixed(2),
        totalTicketsSold,
        totalTicketsAdded: vendorTickets,
        paidBookings: paidBookings.length,
      },
    });
  } catch (error) {
    console.error("Get vendor revenue error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch revenue data",
      error: error.message,
    });
  }
};
