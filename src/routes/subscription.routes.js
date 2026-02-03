import { Router } from "express";
import {
  toggleSubscription,
  getSubscribedChannel,
  getUserChannelSubscribers,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

// Toggle current user's subscription to a channel
router.route("/c/:channelId").post(toggleSubscription);

// Get all subscribers of a specific channel
router.route("/c/:channelId/subscribers").get(getUserChannelSubscribers);

// Get channels the current logged-in user has subscribed to
router.route("/me").get(getSubscribedChannel);

export default router;
