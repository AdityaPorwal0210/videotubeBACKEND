import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js"; // ← ADD THIS

const getChannelStats = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "channel id not found");
  }

  const channelVideos = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "video",
              as: "videoLikes",
            },
          },
          {
            $addFields: {
              likesCount: {
                $size: "$videoLikes",
              },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        totalViews: {
          $sum: "$videos.views",
        },
        totalLikes: {
          $sum: "$videos.likesCount",
        },
        subscriberCount: {
          $size: "$subscribers",
        },
      },
    },
    {
      $project: {
        username: 1,
        fullName: 1,
        avatar: 1,
        coverImage: 1,
        subscriberCount: 1,
        totalViews: 1,
        totalLikes: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, channelVideos, "success"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "channel id not found");
  }

  const channelVideos = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "videos",
        pipeline: [
          {
            $project: {
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              views: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
      },
    },
    {
      $project: {
        username: 1,
        fullName: 1,
        avatar: 1,
        coverImage: 1,
        totalVideos: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, channelVideos, "success"));
});

const getMyDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  // 1) All videos of this channel (current user)
  const videos = await Video.find({ owner: userId }).select(
    "_id views likes createdAt title thumbnail"
  );

  const totalVideos = videos.length;
  const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
  const totalLikesOnVideos = videos.reduce((sum, v) => sum + (v.likes || 0), 0);

  // 2) Subscribers count where current user is the channel
  const subscriberCount = await Subscription.countDocuments({
    channel: userId,
  });

  // 3) Total likes GIVEN by this user
  const totalLikesGiven = await Like.countDocuments({ likedBy: userId });

  // 4) Total comments on this user's videos
  let totalCommentsOnVideos = 0;
  if (videos.length > 0) {
    const videoIds = videos.map((v) => v._id);
    totalCommentsOnVideos = await Comment.countDocuments({
      video: { $in: videoIds },
    });
  }

  // 5) Latest 5 videos
  const latestVideos = videos
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalVideos,
        totalViews,
        totalLikesOnVideos,
        subscriberCount,
        totalLikesGiven,
        totalCommentsOnVideos,
        latestVideos,
      },
      "Dashboard stats fetched successfully"
    )
  );
});

export { getChannelStats, getChannelVideos, getMyDashboardStats };
