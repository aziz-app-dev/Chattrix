import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import {
  socketAuthMiddleware,
  type AuthenticatedSocket,
} from "../middleware/auth_middleware.js";

// Track online users: Map<userId, Set<socketId>>
const onlineUsers = new Map<string, Set<string>>();

export const initializeSocket = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Configure for production
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const socketId = socket.id;

    console.log(`User connected: ${userId} (socket: ${socketId})`);

    // Track user's socket connection
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socketId);

    // Broadcast user online status
    socket.broadcast.emit("user:online", { userId });

    // Join user to their personal room (for direct messages)
    socket.join(`user:${userId}`);

    // =====================
    // CHAT EVENTS
    // =====================

    /**
     * Join a chat room (1-on-1 or group)
     */
    socket.on("chat:join", (roomId: string) => {
      socket.join(roomId);
      console.log(`User ${userId} joined room: ${roomId}`);
      socket.to(roomId).emit("chat:user_joined", {
        userId,
        roomId,
        timestamp: new Date().toISOString(),
      });
    });

    /**
     * Leave a chat room
     */
    socket.on("chat:leave", (roomId: string) => {
      socket.leave(roomId);
      console.log(`User ${userId} left room: ${roomId}`);
      socket.to(roomId).emit("chat:user_left", {
        userId,
        roomId,
        timestamp: new Date().toISOString(),
      });
    });

    /**
     * Send a message to a room
     */
    socket.on(
      "chat:message",
      (data: { roomId: string; message: string; type?: string }) => {
        const { roomId, message, type = "text" } = data;

        const messageData = {
          id: `${Date.now()}-${socketId}`,
          senderId: userId,
          roomId,
          message,
          type,
          timestamp: new Date().toISOString(),
        };

        // Send to all users in the room (including sender for confirmation)
        io.to(roomId).emit("chat:message", messageData);

        console.log(`Message in room ${roomId} from ${userId}: ${message}`);
      }
    );

    /**
     * Send a direct message to a specific user
     */
    socket.on(
      "chat:direct_message",
      (data: { recipientId: string; message: string; type?: string }) => {
        const { recipientId, message, type = "text" } = data;

        const messageData = {
          id: `${Date.now()}-${socketId}`,
          senderId: userId,
          recipientId,
          message,
          type,
          timestamp: new Date().toISOString(),
        };

        // Send to recipient's personal room
        io.to(`user:${recipientId}`).emit("chat:direct_message", messageData);

        // Send back to sender for confirmation
        socket.emit("chat:direct_message", messageData);

        console.log(`Direct message from ${userId} to ${recipientId}`);
      }
    );

    /**
     * Typing indicator
     */
    socket.on("chat:typing", (data: { roomId: string; isTyping: boolean }) => {
      const { roomId, isTyping } = data;
      socket.to(roomId).emit("chat:typing", {
        userId,
        roomId,
        isTyping,
      });
    });

    /**
     * Message read receipt
     */
    socket.on(
      "chat:read",
      (data: { roomId: string; messageIds: string[] }) => {
        const { roomId, messageIds } = data;
        socket.to(roomId).emit("chat:read", {
          userId,
          roomId,
          messageIds,
          timestamp: new Date().toISOString(),
        });
      }
    );

    /**
     * Get online users
     */
    socket.on("users:get_online", (callback: (users: string[]) => void) => {
      const users = Array.from(onlineUsers.keys());
      if (typeof callback === "function") {
        callback(users);
      }
    });

    /**
     * Check if specific user is online
     */
    socket.on(
      "users:is_online",
      (targetUserId: string, callback: (isOnline: boolean) => void) => {
        const isOnline = onlineUsers.has(targetUserId);
        if (typeof callback === "function") {
          callback(isOnline);
        }
      }
    );

    // =====================
    // WEBRTC CALL EVENTS
    // =====================

    /**
     * Join a call room
     */
    socket.on("call:join", (data: { callId: string }) => {
      const { callId } = data;
      socket.join(`call:${callId}`);
      console.log(`User ${userId} joined call: ${callId}`);

      socket.to(`call:${callId}`).emit("call:user_joined", {
        userId,
        callId,
        timestamp: new Date().toISOString(),
      });
    });

    /**
     * Leave a call room
     */
    socket.on("call:leave", (data: { callId: string }) => {
      const { callId } = data;
      socket.leave(`call:${callId}`);
      console.log(`User ${userId} left call: ${callId}`);

      socket.to(`call:${callId}`).emit("call:user_left", {
        userId,
        callId,
        timestamp: new Date().toISOString(),
      });
    });

    /**
     * Answer incoming call
     */
    socket.on("call:answer", (data: { callId: string; accepted: boolean }) => {
      const { callId, accepted } = data;

      io.to(`call:${callId}`).emit("call:answered", {
        userId,
        callId,
        accepted,
        timestamp: new Date().toISOString(),
      });

      console.log(`User ${userId} ${accepted ? "accepted" : "declined"} call: ${callId}`);
    });

    /**
     * WebRTC Offer - Send SDP offer to specific peer
     */
    socket.on(
      "webrtc:offer",
      (data: { targetUserId: string; callId: string; sdp: any }) => {
        const { targetUserId, callId, sdp } = data;

        io.to(`user:${targetUserId}`).emit("webrtc:offer", {
          fromUserId: userId,
          callId,
          sdp,
          timestamp: new Date().toISOString(),
        });

        console.log(`WebRTC offer from ${userId} to ${targetUserId} for call ${callId}`);
      }
    );

    /**
     * WebRTC Answer - Send SDP answer to specific peer
     */
    socket.on(
      "webrtc:answer",
      (data: { targetUserId: string; callId: string; sdp: any }) => {
        const { targetUserId, callId, sdp } = data;

        io.to(`user:${targetUserId}`).emit("webrtc:answer", {
          fromUserId: userId,
          callId,
          sdp,
          timestamp: new Date().toISOString(),
        });

        console.log(`WebRTC answer from ${userId} to ${targetUserId} for call ${callId}`);
      }
    );

    /**
     * WebRTC ICE Candidate - Send ICE candidate to specific peer
     */
    socket.on(
      "webrtc:ice_candidate",
      (data: { targetUserId: string; callId: string; candidate: any }) => {
        const { targetUserId, callId, candidate } = data;

        io.to(`user:${targetUserId}`).emit("webrtc:ice_candidate", {
          fromUserId: userId,
          callId,
          candidate,
          timestamp: new Date().toISOString(),
        });
      }
    );

    /**
     * Toggle audio mute
     */
    socket.on("call:toggle_audio", (data: { callId: string; isMuted: boolean }) => {
      const { callId, isMuted } = data;

      socket.to(`call:${callId}`).emit("call:audio_toggled", {
        userId,
        isMuted,
        timestamp: new Date().toISOString(),
      });
    });

    /**
     * Toggle video
     */
    socket.on("call:toggle_video", (data: { callId: string; isVideoOff: boolean }) => {
      const { callId, isVideoOff } = data;

      socket.to(`call:${callId}`).emit("call:video_toggled", {
        userId,
        isVideoOff,
        timestamp: new Date().toISOString(),
      });
    });

    /**
     * End call
     */
    socket.on("call:end", (data: { callId: string; reason?: string }) => {
      const { callId, reason } = data;

      io.to(`call:${callId}`).emit("call:ended", {
        userId,
        callId,
        reason: reason || "normal",
        timestamp: new Date().toISOString(),
      });

      console.log(`User ${userId} ended call: ${callId}`);
    });

    /**
     * Decline incoming call
     */
    socket.on("call:decline", (data: { callId: string }) => {
      const { callId } = data;

      io.to(`call:${callId}`).emit("call:declined", {
        userId,
        callId,
        timestamp: new Date().toISOString(),
      });

      console.log(`User ${userId} declined call: ${callId}`);
    });

    // =====================
    // DISCONNECT
    // =====================

    socket.on("disconnect", (reason) => {
      console.log(`User disconnected: ${userId} (reason: ${reason})`);

      // Remove this socket from user's connections
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socketId);

        // If user has no more active sockets, mark as offline
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          socket.broadcast.emit("user:offline", { userId });
        }
      }
    });

    // =====================
    // ERROR HANDLING
    // =====================

    socket.on("error", (error) => {
      console.error(`Socket error for user ${userId}:`, error);
    });
  });

  // Handle connection errors
  io.engine.on("connection_error", (err) => {
    console.error("Connection error:", err.message);
  });

  return io;
};

// Utility function to emit to specific user (all their sockets)
export const emitToUser = (
  io: Server,
  userId: string,
  event: string,
  data: any
) => {
  io.to(`user:${userId}`).emit(event, data);
};

// Utility function to get all online user IDs
export const getOnlineUsers = (): string[] => {
  return Array.from(onlineUsers.keys());
};

// Utility function to check if user is online
export const isUserOnline = (userId: string): boolean => {
  return onlineUsers.has(userId);
};
