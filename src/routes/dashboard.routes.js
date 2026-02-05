import { Router } from "express";
import {
  getChannelStats,
  getChannelVideos,
  getMyDashboardStats,
} from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/me").get(getMyDashboardStats);
router.route("/stats/:channelId").get(getChannelStats);
router.route("/videos/:channelId").get(getChannelVideos);

export default router;
