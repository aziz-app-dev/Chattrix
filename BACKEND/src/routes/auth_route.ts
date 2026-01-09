import { Router } from "express";
import { loginUser, registerUser, updateProfileImage, updateProfileName, saveFcmToken, removeFcmToken } from "../controller/auth_controller.js";
import { protectRoute } from "../middleware/auth_middleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.patch("/profile-image", protectRoute, updateProfileImage);
router.patch("/profile-name", protectRoute, updateProfileName);
router.post("/fcm-token", protectRoute, saveFcmToken);
router.delete("/fcm-token", protectRoute, removeFcmToken);

export default router;