import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweet.model.js";

// POST /tweets
export const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    throw new ApiError(400, "no tweet content found");
  }

  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "user not verified");
  }
  console.log("before creating tweet")
  const newTweet = await Tweet.create({
    content,
    owner: userId,
  });
  console.log("after creating tweet")

  return res
    .status(201)
    .json(new ApiResponse(201, newTweet, "new tweet created successfully"));
});

// GET /tweets/user/:userId
export const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "invalid user");
  }

  const userTweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, userTweets, "user tweets fetched successfully"));
});

// PATCH /tweets/:tweetId
export const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "user not found");
  }

  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "invalid tweetId");
  }

  if (!content || content.trim().length === 0) {
    throw new ApiError(400, "content not found");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "no tweet found");
  }

  if (!tweet.owner.equals(userId)) {
    throw new ApiError(403, "You cannot edit another user's tweet");
  }

  tweet.content = content;
  await tweet.save();

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet updated successfully"));
});

// DELETE /tweets/:tweetId
export const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "user not found");
  }

  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "invalid tweetId");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "no tweet found");
  }

  if (!tweet.owner.equals(userId)) {
    throw new ApiError(403, "You cannot delete another user's tweet");
  }

  await tweet.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "tweet deleted successfully"));
});
