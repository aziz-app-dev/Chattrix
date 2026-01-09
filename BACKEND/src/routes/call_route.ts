import { Router } from "express";
import {
  initiateCall,
  getCallHistory,
  getCallDetails,
  updateCallStatus,
  updateParticipantStatus,
} from "../controller/call_controller.js";
import { protectRoute } from "../middleware/auth_middleware.js";

const router = Router();

// All routes require authentication
router.use(protectRoute);

// POST /calls/initiate - Start a new call
router.post("/initiate", initiateCall);

// GET /calls/history - Get call history with pagination
router.get("/history", getCallHistory);

// GET /calls/:callId - Get specific call details
router.get("/:callId", getCallDetails);

// PATCH /calls/:callId/status - Update call status
router.patch("/:callId/status", updateCallStatus);

// PATCH /calls/:callId/participant - Update participant status
router.patch("/:callId/participant", updateParticipantStatus);

export default router;
