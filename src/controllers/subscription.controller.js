import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { Subscription } from "../models/subscription.model";
const toggleSubscription = asyncHandler(async(req,res)=>{
    //verify with auth middleware
    //perform the function to alter the current status
    //first get the current status from subscription models where channel and subscriber are matched
    //if already subscribed then delete that subscription model
    // if not then create new subscription model
    const {channelId} = req.params
    if(!channelId){
        throw new ApiError(400,"channel not found")
    }
    const userId = req.user?._id
    if(!userId){
        throw new ApiError(400,"user not found")
    }
    const existingSubs = await Subscription.findOneAndDelete(
        {
            channel: new mongoose.Types.ObjectId(channelId),
            subscriber:userId,
        }
    )
    if(existingSubs){
            return res.status(200)
            .json(new ApiResponse(200,null,"unsubscribed successfully"))
        }

    const newSubscribe = await Subscription.create({
        channel: new mongoose.Types.ObjectId(channelId),
        subscriber:userId
    })
    return res.status(200)
    .json(new ApiResponse(200,newSubscribe,"subscribed successfully"))
})

const getUserChannelSubscribers = asyncHandler(async(req,res)=>{
    //verify with auth
    //use pipeline
    const {channelId} = req.params
    if(!channelId){
        throw new ApiError(401,"channelId not found")
    }
    const subscriberList = await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(channelId)
            }
        }
    ])
    return res.status(200)
    .json(new ApiResponse(200,subscriberList,"all subscribers for this channel are fetched successfully"))
})

const getSubscribedChannel = asyncHandler(async(req,res)=>{
    //verify with auth
    //use pipeline
    const {userId} = req.params
    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new ApiError(401,"userId not found")
    }
    const subscribedList = await Subscription.aggregate([
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"subscribers",
                pipeline:[{
                    $project:{
                      _id:1,
                      username:1,
                      avatar:1,
                      fullName:1,
                    }

                }]
            }
        }
    ])
    return res.status(200)
    .json(new ApiResponse(200,subscribedList,"all subscribers for this channel are fetched successfully"))
})

export {toggleSubscription,getSubscribedChannel,getUserChannelSubscribers}