import type { Request, Response } from "express";
import Conversation from "../model/conversation_model.js";
import Message from "../model/message_model.js";
import User from "../model/user_model.js";
import { Server } from "socket.io";
import { sendMessageNotification } from "../services/fcm_service.js";

// Socket.io instance will be set from index.ts
let io: Server | null = null;

export const setSocketIO = (socketIO: Server) => {
  io = socketIO;
};

// Get all conversations for the current user
export const getConversations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;
    const { type } = req.query; // 'direct' or 'group'

    const filter: any = { participants: user._id };
    if (type === "direct" || type === "group") {
      filter.type = type;
    }

    const conversations = await Conversation.find(filter)
      .populate("participants", "name email img")
      .populate("lastMessage")
      .populate("admin", "name email img")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching conversations",
    });
  }
};

// Create a direct conversation
export const createDirectConversation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;
    const { recipientId } = req.body;

    if (!recipientId) {
      res.status(400).json({
        success: false,
        message: "Recipient ID is required",
      });
      return;
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      res.status(404).json({
        success: false,
        message: "Recipient not found",
      });
      return;
    }

    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      type: "direct",
      participants: { $all: [user._id, recipientId], $size: 2 },
    })
      .populate("participants", "name email img")
      .populate("lastMessage");

    if (existingConversation) {
      res.status(200).json({
        success: true,
        data: existingConversation,
        message: "Conversation already exists",
      });
      return;
    }

    // Create new conversation
    const conversation = await Conversation.create({
      type: "direct",
      participants: [user._id, recipientId],
    });

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate("participants", "name email img")
      .populate("lastMessage");

    res.status(201).json({
      success: true,
      data: populatedConversation,
      message: "Conversation created successfully",
    });
  } catch (error) {
    console.error("Create direct conversation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating conversation",
    });
  }
};

// Create a group conversation
export const createGroupConversation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;
    const { name, participantIds, avatar } = req.body;

    if (!name || !participantIds || !Array.isArray(participantIds)) {
      res.status(400).json({
        success: false,
        message: "Group name and participants are required",
      });
      return;
    }

    // Include the creator in participants
    const allParticipants = [...new Set([user._id.toString(), ...participantIds])];

    const conversation = await Conversation.create({
      type: "group",
      name,
      avatar: avatar || "",
      participants: allParticipants,
      admin: user._id,
    });

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate("participants", "name email img")
      .populate("admin", "name email img");

    res.status(201).json({
      success: true,
      data: populatedConversation,
      message: "Group created successfully",
    });
  } catch (error) {
    console.error("Create group conversation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating group",
    });
  }
};

// Get messages for a conversation
export const getMessages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;
    const conversationId = req.params.conversationId;
    const { page = 1, limit = 50 } = req.query;

    if (!conversationId) {
      res.status(400).json({
        success: false,
        message: "Conversation ID is required",
      });
      return;
    }

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: user._id,
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
      return;
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "name email img")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: messages.reverse(),
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching messages",
    });
  }
};

// Send a message
export const sendMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;
    const conversationId = req.params.conversationId;
    const { content, type = "text", attachment } = req.body;

    if (!conversationId) {
      res.status(400).json({
        success: false,
        message: "Conversation ID is required",
      });
      return;
    }

    if (!content) {
      res.status(400).json({
        success: false,
        message: "Message content is required",
      });
      return;
    }

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: user._id,
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
      return;
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: user._id,
      content,
      type,
      attachment,
      readBy: [user._id],
    });

    // Update conversation's lastMessage
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
    });

    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "name email img"
    );

    // Emit socket event for real-time delivery
    if (io && populatedMessage) {
      const messageData = {
        id: populatedMessage._id.toString(),
        conversationId: conversationId,
        content: populatedMessage.content,
        type: populatedMessage.type,
        senderId: populatedMessage.sender._id.toString(),
        senderName: (populatedMessage.sender as any).name,
        senderImg: (populatedMessage.sender as any).img,
        timestamp: populatedMessage.createdAt,
      };

      // Get updated conversation for the list update
      const updatedConversation = await Conversation.findById(conversationId)
        .populate("participants", "name email img")
        .populate("lastMessage")
        .populate("admin", "name email img");

      // Emit to conversation room (for group chats)
      io.to(conversationId).emit("chat:message", messageData);

      // Also emit to all participants' personal rooms (for direct chats and conversation list updates)
      conversation.participants.forEach((participantId: any) => {
        const participantIdStr = participantId.toString();
        // Send message notification
        io!.to(`user:${participantIdStr}`).emit("chat:new_message", {
          ...messageData,
          conversation: updatedConversation,
        });
      });
    }

    // Send push notification to other participants (for background/closed app)
    const recipientIds = conversation.participants
      .map((p: any) => p.toString())
      .filter((id: string) => id !== user._id.toString());

    if (recipientIds.length > 0 && populatedMessage) {
      const senderName = (populatedMessage.sender as any).name || "Someone";
      sendMessageNotification(
        recipientIds,
        senderName,
        content,
        conversationId,
        type
      ).catch((err) => console.error("FCM notification error:", err));
    }

    res.status(201).json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while sending message",
    });
  }
};

// Get all users (for starting new conversations)
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { search } = req.query;

    const filter: any = { _id: { $ne: user._id } };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter).select("name email img").limit(50);

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
    });
  }
};
