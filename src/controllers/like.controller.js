import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";

const toggleVideoLike  = asyncHandler(async(req,res)=>{
    //verify user
    // if found one then delete 
    // create like
    const{videoId} = req.params
    const userId = req.user?._id
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(401,"videoId is invalid")
    }
    if(!userId){
        throw new ApiError(401,"userId is invalid")
    }

    const deletedLike = await Like.findOneAndDelete(
        {video:videoId,likedBy:userId}
    )
    if(deletedLike){
        return res.status(200).json(new ApiResponse(200,null,"unliked successfully"))
    }

    const newLike = await Like.create({video:videoId,likedBy:userId})
    if(!newLike){
        throw new ApiError(405,"error while liking this video")
    }
    return res.status(200).json(new ApiResponse(200,newLike,"liked this video successfully"))
})
const toggleCommentLike  = asyncHandler(async(req,res)=>{
    //verify user
    // if found one then delete 
    // create like
    const{commentId} = req.params
    const userId = req.user?._id
    if(!commentId){
        throw new ApiError(401,"commentId is invalid")
    }
    if(!userId){
        throw new ApiError(401,"userId is invalid")
    }

    const deletedLike = await Like.findOneAndDelete(
        {comment:commentId,likedBy:userId}
    )
    if(deletedLike){
        return res.status(200).json(new ApiResponse(200,null,"unliked successfully"))
    }

    const newLike = await Like.create({comment:commentId,likedBy:userId})
    if(!newLike){
        throw new ApiError(405,"error while liking this video")
    }
    return res.status(200).json(new ApiResponse(200,newLike,"liked this video successfully"))
})

const toggleTweetLike  = asyncHandler(async(req,res)=>{
    //verify user
    // if found one then delete 
    // create like
    const{tweetId} = req.params
    const userId = req.user?._id
    if(!tweetId){
        throw new ApiError(401,"TweetId is invalid")
    }
    if(!userId){
        throw new ApiError(401,"userId is invalid")
    }

    const deletedLike = await Like.findOneAndDelete(
        {tweet:tweetId,likedBy:userId}
    )
    if(deletedLike){
        return res.status(200).json(new ApiResponse(200,null,"unliked successfully"))
    }

    const newLike = await Like.create({tweet:tweetId,likedBy:userId})
    if(!newLike){
        throw new ApiError(405,"error while liking this video")
    }
    return res.status(200).json(new ApiResponse(200,newLike,"liked this video successfully"))
})

const getLikedVideos = asyncHandler(async(req,res)=>{
    //verify user

    const userId = req.user?._id
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid User ID");
    }

    const likedVideos = await Like.aggregate([
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $exists: true,$ne : null},
            },
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"videoDetails",
                pipeline:[
                    {
                        $project:{
                            videoFile:1,
                            thumbnail:1,
                            title:1,
                            owner:1
                        }
                    }
                ]
            }
        },
        {
         $unwind: {
         path: "$videoDetails",
         preserveNullAndEmptyArrays: false,
         },
        },
    ])
    
    return res.status(200).json(new ApiResponse(200,likedVideos,"fetched liked videos successfully"))
    
})

export {getLikedVideos,toggleCommentLike,toggleTweetLike,toggleVideoLike}