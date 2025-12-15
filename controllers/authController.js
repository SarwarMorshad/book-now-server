import { ObjectId } from "mongodb";
import { getCollections } from "../config/db.js";
import { generateToken } from "../utils/generateToken.js";

// Register or Login User (Firebase handles authentication)
export const registerOrLoginUser = async (req, res) => {
  try {
    console.log("=== AUTH REQUEST ===");
    console.log("Body:", req.body);

    const { name, email, photoURL, firebaseUid } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const { users } = getCollections();

    console.log("Looking for user with email:", email);

    // Check if user exists
    let user = await users.findOne({ email });

    console.log("User found:", !!user);

    if (user) {
      // User exists - login
      const token = generateToken(user);

      console.log("Login successful for:", email);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          photoURL: user.photoURL,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
    }

    // User doesn't exist - register
    const newUser = {
      name: name || "User",
      email,
      photoURL: photoURL || "",
      firebaseUid: firebaseUid || null,
      role: "user", // Default role
      isFraud: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("Creating new user:", newUser);

    const result = await users.insertOne(newUser);
    newUser._id = result.insertedId;

    const token = generateToken(newUser);

    console.log("Registration successful for:", email);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        photoURL: newUser.photoURL,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    });
  }
};

// Update User Profile
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, photoURL } = req.body;

    console.log("=== UPDATE PROFILE ===");
    console.log("User ID:", userId);
    console.log("New data:", { name, photoURL });

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

    console.log("Profile updated successfully");

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
