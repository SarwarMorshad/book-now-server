import { ObjectId } from "mongodb";
import { getCollections } from "../config/db.js";
import { generateToken } from "../utils/generateToken.js";

// Register or Login User (Firebase handles authentication)
export const registerOrLoginUser = async (req, res) => {
  // ... your existing code ...
};

// Update User Profile - ADD THIS FUNCTION
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, photoURL } = req.body;

    const { users } = getCollections();

    // Update user in database
    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          name: name,
          photoURL: photoURL,
          updatedAt: new Date(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found or no changes made",
      });
    }

    // Get updated user
    const updatedUser = await users.findOne(
      { _id: new ObjectId(userId) },
      { projection: { firebaseUid: 0 } }
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};
