import { Router } from "express";
import {
  getConversations,
  createDirectConversation,
  createGroupConversation,
  getMessages,
  sendMessage,
  getUsers,
} from "../controller/conversation_controller.js";
import { protectRoute } from "../middleware/auth_middleware.js";

const router = Router();

// All routes require authentication
router.use(protectRoute);

// Conversations
router.get("/", getConversations);
router.post("/direct", createDirectConversation);
router.post("/group", createGroupConversation);

// Messages
router.get("/:conversationId/messages", getMessages);
router.post("/:conversationId/messages", sendMessage);

// Users
router.get("/users", getUsers);

export default router;
