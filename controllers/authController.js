import { ObjectId } from "mongodb";
import { getCollections } from "../config/db.js";
import { generateToken } from "../utils/generateToken.js";

// Register or Login User (Firebase handles authentication)
export const registerOrLoginUser = async (req, res) => {
  try {
    const { name, email, photoURL, firebaseUid } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const { users } = getCollections();

    // Check if user exists
    let user = await users.findOne({ email });

    if (user) {
      // User exists - login
      const token = generateToken(user);

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

    const result = await users.insertOne(newUser);
    newUser._id = result.insertedId;

    const token = generateToken(newUser);

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

// Get User Profile
export const getUserProfile = async (req, res) => {
  try {
    const { users } = getCollections();
    const user = await users.findOne({ _id: new ObjectId(req.user.id) }, { projection: { firebaseUid: 0 } });

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
    console.error("Get profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
};
