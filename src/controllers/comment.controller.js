import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";

// Add comment (you already have this)
const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;
  const { content } = req.body;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  if (!content?.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  const comment = await Comment.create({
    video: videoId,
    content: content.trim(),
    owner: userId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"));
});

// Update comment
const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user?._id;
  const { content } = req.body;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }
  if (!content?.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  const updatedComment = await Comment.findOneAndUpdate(
    {
      _id: commentId,
      owner: userId, // only owner can edit
    },
    { content: content.trim() },
    { new: true }
  );

  if (!updatedComment) {
    throw new ApiError(404, "Comment not found or unauthorized");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

// Delete comment
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user?._id;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  const deletedComment = await Comment.findOneAndDelete({
    _id: commentId,
    owner: userId, // only owner can delete
  });

  if (!deletedComment) {
    throw new ApiError(404, "Comment not found or unauthorized");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Comment deleted successfully"));
});

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  let { page = 1, limit = 10 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  page = parseInt(page);
  limit = parseInt(limit);

  const skip = (page - 1) * limit;

  const pipeline = [
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: "$owner",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  const comments = await Comment.aggregate(pipeline);

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

export { addComment, updateComment, deleteComment, getVideoComments };
