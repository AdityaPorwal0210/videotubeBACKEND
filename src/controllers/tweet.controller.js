import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { Tweet } from "../models/tweet.model";
import { User } from "../models/user.model";
import {v2 as cloudinary} from "cloudinary"
const createTweet = asyncHandler(async (req, res) => {
  
  const { content } = req.body;                     

  if (!content || content.trim().length === 0) {
    throw new ApiError(400, "no tweet content found"); 
  }

  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "user not verified");
  }

  try {
    const newTweet = await Tweet.create({          
      content,                                      
      owner: userId,
    });

    return res
      .status(201)                                 
      .json(new ApiResponse(201, newTweet, "new tweet created successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "error while creating new tweet");
  }
});

const getUserTweets = asyncHandler(async(req,res)=>{
//verify with auth middleware
const userId = req.user?._id
if(!userId){
    throw new ApiError(404,"invalid user")
}
const userTweets = await Tweet.aggregate(
    [
        {
            $match:{
                owner:userId
            }
        },
        {
            $project:{
            content:1,
            }
        },
    ]
)
return res.status(200)
        .json(new ApiResponse(200,userTweets,"user tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
  const { content, tweetId } = req.body;            

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


const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.body;                     

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

export {createTweet,getUserTweets,updateTweet,deleteTweet}