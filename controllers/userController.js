import { ObjectId } from "mongodb";
import { getCollections } from "../config/db.js";

// Get All Users (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const { users } = getCollections();
    const allUsers = await users.find({}).toArray();

    res.status(200).json({
      success: true,
      count: allUsers.length,
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

// Update User Role (Admin only)
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["user", "vendor", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be 'user', 'vendor', or 'admin'",
      });
    }

    const { users } = getCollections();
    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          role: role,
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
    console.error("Update role error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user role",
      error: error.message,
    });
  }
};

// Mark Vendor as Fraud (Admin only)
export const markVendorAsFraud = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const { users, tickets } = getCollections();

    // Check if user is a vendor
    const vendor = await users.findOne({ _id: new ObjectId(vendorId) });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    if (vendor.role !== "vendor") {
      return res.status(400).json({
        success: false,
        message: "User is not a vendor",
      });
    }

    // Mark vendor as fraud
    await users.updateOne(
      { _id: new ObjectId(vendorId) },
      {
        $set: {
          isFraud: true,
          updatedAt: new Date(),
        },
      }
    );

    // Hide all tickets from this vendor
    await tickets.updateMany(
      { vendorEmail: vendor.email },
      {
        $set: {
          verificationStatus: "rejected",
          updatedAt: new Date(),
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Vendor marked as fraud. All tickets have been hidden.",
    });
  } catch (error) {
    console.error("Mark fraud error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark vendor as fraud",
      error: error.message,
    });
  }
};

// Get User by ID
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const { users } = getCollections();

    const user = await users.findOne({ _id: new ObjectId(userId) }, { projection: { firebaseUid: 0 } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error.message,
    });
  }
};
