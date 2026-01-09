import type { Request, Response } from "express";
import { Server } from "socket.io";
import { Types } from "mongoose";
import Call from "../model/call_model.js";
import { sendCallNotification } from "../services/fcm_service.js";

let io: Server | null = null;

export const setCallSocketIO = (socketIO: Server) => {
  io = socketIO;
};

// Initiate a new call
export const initiateCall = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;
    const { type, participantIds, conversationId, isGroupCall } = req.body;

    if (!type || !participantIds || !Array.isArray(participantIds)) {
      res.status(400).json({
        success: false,
        message: "Call type and participants are required",
      });
      return;
    }

    if (participantIds.length === 0) {
      res.status(400).json({
        success: false,
        message: "At least one participant is required",
      });
      return;
    }

    // Validate participant count for group calls (max 4 total including initiator)
    if (participantIds.length > 3) {
      res.status(400).json({
        success: false,
        message: "Group calls support maximum 4 participants",
      });
      return;
    }

    // Create participants array with pending status
    const participants: {
      user: Types.ObjectId;
      status: "pending" | "joined" | "left" | "declined" | "missed";
      joinedAt?: Date;
    }[] = participantIds.map((id: string) => ({
      user: new Types.ObjectId(id),
      status: "pending" as const,
    }));

    // Add initiator as first participant with joined status
    participants.unshift({
      user: new Types.ObjectId(user._id),
      status: "joined",
      joinedAt: new Date(),
    });

    const call = await Call.create({
      type,
      initiator: user._id,
      participants,
      conversation: conversationId || undefined,
      isGroupCall: isGroupCall || participantIds.length > 1,
      status: "ringing",
    });

    const populatedCall = await Call.findById(call._id)
      .populate("initiator", "name email img")
      .populate("participants.user", "name email img")
      .populate("conversation");

    // Emit incoming call event to all participants
    if (io) {
      participantIds.forEach((participantId: string) => {
        io!.to(`user:${participantId}`).emit("call:incoming", {
          call: populatedCall,
          callId: call._id.toString(),
          callerId: user._id.toString(),
          callerName: user.name,
          callerImg: user.img,
          callType: type,
          isGroupCall: isGroupCall || participantIds.length > 1,
        });
      });
    }

    // Send push notification for incoming call (for background/closed app)
    sendCallNotification(
      participantIds,
      user.name,
      type,
      call._id.toString()
    ).catch((err) => console.error("FCM call notification error:", err));

    res.status(201).json({
      success: true,
      message: "Call initiated successfully",
      data: populatedCall,
    });
  } catch (error) {
    console.error("Initiate call error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while initiating call",
    });
  }
};

// Get call history for current user
export const getCallHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));

    const calls = await Call.find({
      "participants.user": user._id,
    })
      .populate("initiator", "name email img")
      .populate("participants.user", "name email img")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Call.countDocuments({
      "participants.user": user._id,
    });

    res.status(200).json({
      success: true,
      data: calls,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get call history error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching call history",
    });
  }
};

// Get call details
export const getCallDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { callId } = req.params;
    const user = (req as any).user;

    const call = await Call.findById(callId)
      .populate("initiator", "name email img")
      .populate("participants.user", "name email img")
      .populate("conversation");

    if (!call) {
      res.status(404).json({
        success: false,
        message: "Call not found",
      });
      return;
    }

    // Check if user is participant
    const isParticipant = call.participants.some(
      (p) => p.user._id.toString() === user._id.toString()
    );

    if (!isParticipant) {
      res.status(403).json({
        success: false,
        message: "You are not a participant of this call",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: call,
    });
  } catch (error) {
    console.error("Get call details error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching call details",
    });
  }
};

// Update call status
export const updateCallStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { callId } = req.params;
    const { status, endReason } = req.body;
    const user = (req as any).user;

    const call = await Call.findById(callId);
    if (!call) {
      res.status(404).json({
        success: false,
        message: "Call not found",
      });
      return;
    }

    // Check if user is participant
    const isParticipant = call.participants.some(
      (p) => p.user.toString() === user._id.toString()
    );

    if (!isParticipant) {
      res.status(403).json({
        success: false,
        message: "You are not a participant of this call",
      });
      return;
    }

    // Update call status
    call.status = status;

    if (status === "ongoing" && !call.startedAt) {
      call.startedAt = new Date();
    }

    if (status === "ended" || status === "missed" || status === "declined") {
      call.endedAt = new Date();
      if (call.startedAt) {
        call.duration = Math.floor(
          (call.endedAt.getTime() - call.startedAt.getTime()) / 1000
        );
      }
      if (endReason) {
        call.metadata = { ...call.metadata, endReason };
      }
    }

    await call.save();

    const populatedCall = await Call.findById(callId)
      .populate("initiator", "name email img")
      .populate("participants.user", "name email img");

    // Emit status update to all participants
    if (io) {
      call.participants.forEach((participant) => {
        io!.to(`user:${participant.user.toString()}`).emit("call:status_update", {
          callId,
          status,
          call: populatedCall,
        });
      });
    }

    res.status(200).json({
      success: true,
      message: "Call status updated",
      data: populatedCall,
    });
  } catch (error) {
    console.error("Update call status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating call status",
    });
  }
};

// Update participant status in a call
export const updateParticipantStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { callId } = req.params;
    const { participantStatus } = req.body;
    const user = (req as any).user;

    const call = await Call.findById(callId);
    if (!call) {
      res.status(404).json({
        success: false,
        message: "Call not found",
      });
      return;
    }

    // Find and update participant
    const participantIndex = call.participants.findIndex(
      (p) => p.user.toString() === user._id.toString()
    );

    if (participantIndex === -1) {
      res.status(403).json({
        success: false,
        message: "You are not a participant of this call",
      });
      return;
    }

    const participant = call.participants[participantIndex]!;
    participant.status = participantStatus;

    if (participantStatus === "joined") {
      participant.joinedAt = new Date();
    } else if (participantStatus === "left") {
      participant.leftAt = new Date();
    }

    await call.save();

    const populatedCall = await Call.findById(callId)
      .populate("initiator", "name email img")
      .populate("participants.user", "name email img");

    res.status(200).json({
      success: true,
      message: "Participant status updated",
      data: populatedCall,
    });
  } catch (error) {
    console.error("Update participant status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating participant status",
    });
  }
};
