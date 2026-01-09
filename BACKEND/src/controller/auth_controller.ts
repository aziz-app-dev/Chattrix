import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../model/user_model.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const JWT_EXPIRES_IN = "7d";

export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password, name, img } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        message: "Please provide email, password and name",
      });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      img: img || "",
    });

    const token = jwt.sign(
      {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.img || null,
        },
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        img: user.img,
        token,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password as string);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    const token = jwt.sign(
      {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.img || null,
        },
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        img: user.img,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

export const updateProfileImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;
    const img = req.body?.img;

    if (!img || typeof img !== "string") {
      res.status(400).json({
        success: false,
        message: "Please provide image URL",
      });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { img },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Generate new token with updated user data
    const token = jwt.sign(
      {
        user: {
          id: updatedUser._id,
          email: updatedUser.email,
          name: updatedUser.name,
          avatar: updatedUser.img || null,
        },
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      data: {
        id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        img: updatedUser.img,
        token,
      },
    });
  } catch (error) {
    console.error("Update profile image error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during profile update",
    });
  }
};

export const updateProfileName = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;
    const name = req.body?.name;

    if (!name || typeof name !== "string") {
      res.status(400).json({
        success: false,
        message: "Please provide name",
      });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { name },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Generate new token with updated user data
    const token = jwt.sign(
      {
        user: {
          id: updatedUser._id,
          email: updatedUser.email,
          name: updatedUser.name,
          avatar: updatedUser.img || null,
        },
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: "Profile name updated successfully",
      data: {
        id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        img: updatedUser.img,
        token,
      },
    });
  } catch (error) {
    console.error("Update profile name error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during profile update",
    });
  }
};

// Save or update FCM token for push notifications
export const saveFcmToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;
    const { fcmToken, platform } = req.body;
    console.log(fcmToken);
    

    if (!fcmToken || !platform) {
      res.status(400).json({
        success: false,
        message: "Please provide fcmToken and platform",
      });
      return;
    }

    if (!['android', 'ios'].includes(platform)) {
      res.status(400).json({
        success: false,
        message: "Platform must be 'android' or 'ios'",
      });
      return;
    }

    // Find user and update fcmTokens
    const existingUser = await User.findById(user._id);
    if (!existingUser) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Initialize fcmTokens if not exists
    if (!existingUser.fcmTokens) {
      existingUser.fcmTokens = [];
    }

    // Check if token already exists
    const existingTokenIndex = existingUser.fcmTokens.findIndex(
      (t: any) => t.token === fcmToken
    );

 if (existingTokenIndex >= 0 && existingUser.fcmTokens?.[existingTokenIndex]) {
  existingUser.fcmTokens[existingTokenIndex]!.createdAt = new Date();
}
else {
      // Add new token (limit to 5 tokens per user)
      if (existingUser.fcmTokens.length >= 5) {
        // Remove oldest token
        existingUser.fcmTokens.shift();
      }
      existingUser.fcmTokens.push({
        token: fcmToken,
        platform,
        createdAt: new Date(),
      });
    }

    await existingUser.save();

    res.status(200).json({
      success: true,
      message: "FCM token saved successfully",
    });
  } catch (error) {
    console.error("Save FCM token error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while saving FCM token",
    });
  }
};

// Remove FCM token (on logout)
export const removeFcmToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;
    const { fcmToken } = req.body;

    if (!fcmToken) {
      res.status(400).json({
        success: false,
        message: "Please provide fcmToken",
      });
      return;
    }

    await User.findByIdAndUpdate(user._id, {
      $pull: { fcmTokens: { token: fcmToken } },
    });

    res.status(200).json({
      success: true,
      message: "FCM token removed successfully",
    });
  } catch (error) {
    console.error("Remove FCM token error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while removing FCM token",
    });
  }
};
