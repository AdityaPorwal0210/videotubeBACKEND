import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { Tweet } from "../models/tweet.model";
import { User } from "../models/user.model";
import {v2 as cloudinary} from "cloudinary"
const createTweet = asyncHandler(async (req,res)=>{
    //first we will verify the user with auth midlleware 
    const {tweet} = req.body
    if(!tweet){
        throw new ApiError(401,"no tweet found")
    }
    const userId = req.user?._id
    if(!userId){
        throw new ApiError(401,"user not verified")
    }
    try {
        const newTweet = Tweet.create({
            constent:tweet,
            owner:userId
        })
        return res.status(200)
        .json(new ApiResponse(200,newTweet,"new tweet created successfully"))
    } catch (error) {
        throw new ApiError(402,"error while crating newTweet")
    }
    
})

const getUserTweets = asyncHandler(async(req,res)=>{
//verify with auth middleware
const userId = req.user?._id
if(!userId){
    throw new ApiError(404,"invalid user")
}
const userTweets = Tweet.aggregate(
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

const updateTweet = asyncHandler(async(req,res)=>{
    // verify with auth
    const {content,tweet_id}= req.body
    const userId = req.user?._id
    if(!userId){
        throw new ApiError(200,"user not found")
    }
    if(!tweet_id){
        throw new ApiError(406,"tweet not found")
    }
    if(!content){
        throw new ApiError(406,"content not found")
    }
    const tweet = await Tweet.findById(tweet_id)
    if(!tweet){
        throw new ApiError(405,"no tweet found")
    }
    if (!tweet.owner.equals(userId)) {
    throw new ApiError(403, "You cannot edit another user's tweet");
  }
    tweet.content=content
    await tweet.save();
    return res.status(200)
    .json(new ApiResponse(200,tweet,"tweet updated successfully"))
})

const deleteTweet = asyncHandler(async(req,res)=>{
    // verify with auth
    const {tweet_id}= req.body
    const userId = req.user?._id
    if(!userId){
        throw new ApiError(200,"user not found")
    }
    if(!tweet_id){
        throw new ApiError(406,"tweet not found")
    }
    const tweet = await Tweet.findById(tweet_id)
    if(!tweet){
        throw new ApiError(405,"no tweet found")
    }
    if (!tweet.owner.equals(userId)) {
    throw new ApiError(403, "You cannot edit another user's tweet");
  }
    
    await tweet.deleteOne();
    return res.status(200)
    .json(new ApiResponse(200,null,"tweet updated successfully"))
})
export {createTweet,getUserTweets,updateTweet,deleteTweet}