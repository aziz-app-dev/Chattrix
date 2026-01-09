import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { Socket } from "socket.io";
import User from "../model/user_model.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

export interface JwtPayload {
  user: {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
  };
  iat: number;
  exp: number;
}

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

/**
 * Verify JWT token and return payload
 */
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error:any) {
    console.log(error);
    
    return null;
  }
};

/**
 * Check if user exists in database
 */
export const validateUser = async (userId: string) => {
  try {
    const user = await User.findById(userId).select("-password");
    return user;
  } catch (error) {
    return null;
  }
};

/**
 * Socket.IO authentication middleware
 * Validates JWT token from handshake auth or query params
 */
export const socketAuthMiddleware = async (
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
) => {
  try {
    // Get token from auth header or query params
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "") ||
      socket.handshake.query?.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    // Verify JWT token
    const decoded = verifyToken(token as string);
    if (!decoded) {
      return next(new Error("Authentication error: Invalid or expired token"));
    }

    // Validate user exists in database
    const user = await validateUser(decoded.user.id);
    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    // Attach user info to socket
    socket.userId = decoded.user.id;
    socket.userEmail = decoded.user.email;

    next();
  } catch (error) {
    console.error("Socket auth error:", error);
    next(new Error("Authentication error: Server error"));
  }
};

/**
 * Express middleware for protected routes
 */
export const protectRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Not authorized, no token provided",
      });
      return;
    }

    const token = authHeader.split(" ")[1] as string;
    const decoded = verifyToken(token as string);

    if (!decoded) {
      res.status(401).json({
        success: false,
        message: "Not authorized, invalid or expired token",
      });
      return;
    }

    const user = await validateUser(decoded.user.id);
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Not authorized, user not found",
      });
      return;
    }

    // Attach user to request
    (req as any).user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during authentication",
    });
  }
};
