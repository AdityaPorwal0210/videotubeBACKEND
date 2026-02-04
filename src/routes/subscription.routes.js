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
// POST /api/v1/subscriptions/c/:channelId
router.route("/c/:channelId").post(toggleSubscription);

// Get all subscribers of a specific channel
// GET /api/v1/subscriptions/c/:channelId/subscribers
router.route("/c/:channelId/subscribers").get(getUserChannelSubscribers);

// Get channels a given user has subscribed to
// GET /api/v1/subscriptions/u/:userId
router.route("/me").get(getSubscribedChannel);
export default router;
