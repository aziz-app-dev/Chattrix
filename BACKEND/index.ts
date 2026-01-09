import express, { type Application } from "express";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/auth_route.js";
import conversationRoutes from "./src/routes/conversation_route.js";
import callRoutes from "./src/routes/call_route.js";
import { initializeSocket } from "./src/socket/socket_server.js";
import { setSocketIO } from "./src/controller/conversation_controller.js";
import { setCallSocketIO } from "./src/controller/call_controller.js";
import { initializeFirebase } from "./src/services/fcm_service.js";

dotenv.config();

// Initialize Firebase Admin SDK for push notifications
initializeFirebase();

const app: Application = express();
const httpServer = createServer(app);

/* Middlewares */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//  Routes
app.use("/auth", authRoutes);
app.use("/conversations", conversationRoutes);
app.use("/calls", callRoutes);
/* Test Route */
app.get("/", (_, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
  });
});

/* Connect DB */
connectDB();

/* Initialize Socket.IO */
const io = initializeSocket(httpServer);
setSocketIO(io);
setCallSocketIO(io);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO ready for connections`);
});

export { app, io };
