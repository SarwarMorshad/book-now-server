import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create payment intent
export const createPaymentIntent = async (req, res) => {
  try {
    const db = getDB();
    const { bookingId } = req.body;

    console.log("Creating payment intent for booking:", bookingId);

    // Get booking details
    const booking = await db.collection("bookings").findOne({
      _id: new ObjectId(bookingId),
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if booking is accepted
    if (booking.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Only accepted bookings can be paid",
      });
    }

    // Check if user owns this booking
    if (booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalPrice * 100), // Convert to cents
      currency: "usd",
      metadata: {
        bookingId: bookingId,
        userId: req.user.userId,
      },
    });

    console.log("Payment intent created:", paymentIntent.id);

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
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

// Confirm payment
export const confirmPayment = async (req, res) => {
  try {
    const db = getDB();
    const { bookingId, paymentIntentId } = req.body;

    console.log("Confirming payment for booking:", bookingId);

    // Get booking
    const booking = await db.collection("bookings").findOne({
      _id: new ObjectId(bookingId),
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Update booking status to paid
    await db.collection("bookings").updateOne(
      { _id: new ObjectId(bookingId) },
      {
        $set: {
          status: "paid",
          paymentIntentId: paymentIntentId,
          updatedAt: new Date(),
        },
      }
    );

    // Reduce ticket quantity
    await db.collection("tickets").updateOne(
      { _id: booking.ticketId },
      {
        $inc: { quantity: -booking.quantity },
      }
    );

    // Create transaction record
    const transaction = {
      bookingId: new ObjectId(bookingId),
      userId: booking.userId,
      amount: booking.totalPrice,
      paymentIntentId: paymentIntentId,
      status: "completed",
      createdAt: new Date(),
    };

    await db.collection("transactions").insertOne(transaction);

    console.log("Payment confirmed successfully");

    res.status(200).json({
      success: true,
      message: "Payment successful",
    });
  } catch (error) {
    console.error("Confirm payment error:", error);
    res.status(500).json({
      success: false,
      message: "Payment confirmation failed",
      error: error.message,
    });
  }
};

// Get user transactions
export const getUserTransactions = async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.userId;

    const transactions = await db
      .collection("transactions")
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      transactions,
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
