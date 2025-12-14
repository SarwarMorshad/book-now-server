// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { ticketId, quantity } = req.body;

    // Validate required fields
    if (!ticketId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Ticket ID and quantity are required",
      });
    }

    // Get ticket details
    const ticket = await Ticket.findById(ticketId);
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

    // Get user details
    const user = await User.findById(userId);

    // Create booking
    const booking = new Booking({
      userId,
      ticketId,
      quantity,
      totalPrice,
      status: "pending",
    });

    await booking.save();

    // Populate ticket and user details for response
    await booking.populate("ticket");
    await booking.populate("user", "-password");

    res.status(201).json({
      success: true,
      message: "Booking created successfully. Waiting for vendor approval.",
      booking,
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
