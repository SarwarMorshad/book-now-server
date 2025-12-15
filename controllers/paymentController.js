import { ObjectId } from "mongodb";
import Stripe from "stripe";
import { getCollections } from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Payment Intent
export const createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      payment_method_types: ["card"],
    });

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

// Confirm Payment
export const confirmPayment = async (req, res) => {
  try {
    const { bookingId, paymentIntentId } = req.body;
    const { bookings, tickets, transactions } = getCollections();

    console.log("Confirming payment for booking:", bookingId);

    // Get booking
    const booking = await bookings.findOne({
      _id: new ObjectId(bookingId),
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Get ticket info
    const ticket = await tickets.findOne({
      _id: new ObjectId(booking.ticketId),
    });

    // Update booking status to paid
    await bookings.updateOne(
      { _id: new ObjectId(bookingId) },
      {
        $set: {
          status: "paid",
          paymentIntentId: paymentIntentId,
          paidAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    // Reduce ticket quantity
    await tickets.updateOne(
      { _id: new ObjectId(booking.ticketId) },
      {
        $inc: { quantity: -booking.quantity },
      }
    );

    // Create transaction record with ticket title
    const transaction = {
      bookingId: new ObjectId(bookingId),
      userId: booking.userId,
      userEmail: booking.userEmail,
      ticketId: new ObjectId(booking.ticketId),
      ticketTitle: ticket?.title || "Unknown Ticket",
      amount: booking.totalPrice,
      paymentIntentId: paymentIntentId,
      status: "completed",
      createdAt: new Date(),
    };

    await transactions.insertOne(transaction);

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

// Get User Transactions (with ticket title lookup)
// Get User Transactions (with ticket title lookup)
export const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { transactions, bookings, tickets } = getCollections();

    console.log("Fetching transactions for userId:", userId);

    // Find by userId (as ObjectId)
    const userTransactions = await transactions
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    console.log("Found transactions:", userTransactions.length);

    // Populate ticket title for each transaction
    const populatedTransactions = await Promise.all(
      userTransactions.map(async (transaction) => {
        // If ticketTitle already exists and valid, use it
        if (
          transaction.ticketTitle &&
          transaction.ticketTitle !== "Unknown Ticket" &&
          transaction.ticketTitle !== "N/A"
        ) {
          return transaction;
        }

        // Otherwise, try to get from booking -> ticket
        try {
          let ticketTitle = "N/A";

          // Get booking
          if (transaction.bookingId) {
            const booking = await bookings.findOne({
              _id: new ObjectId(transaction.bookingId),
            });

            if (booking && booking.ticketId) {
              const ticket = await tickets.findOne({
                _id: new ObjectId(booking.ticketId),
              });
              ticketTitle = ticket?.title || "N/A";
            }
          }

          return {
            ...transaction,
            ticketTitle,
          };
        } catch (err) {
          console.error("Error fetching ticket title:", err);
          return {
            ...transaction,
            ticketTitle: "N/A",
          };
        }
      })
    );

    res.status(200).json({
      success: true,
      transactions: populatedTransactions,
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
