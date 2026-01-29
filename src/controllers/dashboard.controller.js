import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { Like } from "../models/like.model";
import { Video } from "../models/video.model";
import { Subscription } from "../models/subscription.model";
import { User } from "../models/user.model";

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const {channelId} = req.params
    if(!mongoose.Types.ObjectId(channelId)){
        throw new ApiError(400,"channel id not found")
    }
    const channelVideos = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers",
            }
        },
        {
           $lookup:{
             from:"videos",
             localField:"_id",
             foreignField:"owner",
             as:"videos",
             pipeline:[
                {
                  $lookup:{
                    from:"likes",
                    localField:"_id",
                    foreignField:"video",
                    as:"videoLikes",
                  }
                },
                {
                  $addFields:{
                    likesCount:{
                        $size:"$videoLikes"
                    }
                  }
                },
                
             ]
           }
        },
        {
            $addFields:{
              totalViews:{
                $sum:"$videos.views"
              },
              totalLikes:{
                $sum:"$videos.likesCount"
              },
               subscriberCount:{
                    $size:"$subscribers"
                }
            }
        },
        {
            $project: {
                username: 1,
                fullName: 1,
                avatar: 1,
                coverImage: 1,
                subscriberCount: 1,
                totalVideos: 1,
                totalViews: 1,
                totalLikes: 1
            }
        }
        
    ])
    return res.status(200).json(new ApiResponse(200,channelVideos,"success"))
})
const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const {channelId} = req.params
    if(!mongoose.Types.ObjectId(channelId)){
        throw new ApiError(400,"channel id not found")
    }
    const channelVideos = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(channelId)
            }
        },
        {
           $lookup:{
             from:"videos",
             localField:"_id",
             foreignField:"owner",
             as:"videos",
             pipeline:[
                {
                    $project:{
                        videoFile:1,
                        thumbnail:1,
                        title:1,
                        views:1
                    }
                }
             ]
           }
        },
         {
            $addFields:{
              totalVideos:{
                $size:"$videos"
              }
            }
        },
        {
            $project: {
                username: 1,
                fullName: 1,
                avatar: 1,
                coverImage: 1,
                totalVideos:1
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200,channelVideos,"success"))
})