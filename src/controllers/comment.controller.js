import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { Comment } from "../models/comment.model";
import { ApiResponse } from "../utils/ApiResponse";

const getVideoComments = asyncHandler(async(req,res)=>{

    const {videoId} = req.params
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;
    if(!mongoose.Types.ObjectId(videoId)){
        throw new ApiError(404,"videoId not valid")
    }

    const videoComments = await Comment.aggregate([
        {
            $match:{
               video: new mongoose.Types.ObjectId(videoId)
            }
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"ownerDetails",
                pipeline:[
                    {
                       $project:{
                        username:1,
                        fullName:1,
                        avatar:1
                       }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner: { $first: "$ownerDetails" }
            }
        },
        {
            $project:{
              ownerDetails:0
            }
        }
    ])
     return res.status(200).json(new ApiResponse(200,videoComments,"video comments fetched successfully"))
})

const addComment = asyncHandler(async(req,res)=>{
    //verify
    const userId = req.user?._id
    const {videoId} = req.params
    const {content} = req.body
    if(!mongoose.Types.ObjectId(videoId)){
        throw new ApiError(404,"videoId not valid")
    }

    const newComment = await Comment.create(
        {
          content:content,
          video:videoId,
          owner:userId
        }
    )
    if(!newComment){
        throw new ApiError(406,"error while creating  a comment")
    }
    return res.status(200).json(new ApiResponse(200,newComment,"comment created successfully"))
})

const updateComment = asyncHandler(async(req,res)=>{
    //verify
    const userId=req.user?._id
    if(!userId){
        throw new ApiError(400,"userId invalid")
    }
    const {commentId}=req.params
     if(!commentId){
        throw new ApiError(400,"commentId invalid")
    }
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      throw new ApiError(403, "empty content");
    }

    const updatedComment = await Comment.findOneAndUpdate({owner:userId,_id:commentId},{content:content},{new:true})
    if(!updatedComment){
        throw new ApiError(400,"Comment updation failed")
    }
    return res.status(200).json(new ApiResponse(200,updatedComment,"comment updated successfully"))
})

const deleteComment = asyncHandler(async(req,res)=>{
    //verify 
    const userId = req.user?._id;
    if(!userId){
        throw new ApiError(400,"userId invalid")
    }
    const {commentId}=req.params
     if(!commentId){
        throw new ApiError(400,"commentId invalid")
    }
    const deletedComment = await Comment.findOneAndDelete({_id:commentId,owner:userId})
    if(!deletedComment){
        throw new ApiError(402,"comment deletion failed")
    }
    return res.status(200).json(new ApiResponse(200,null,"comment deleted successfully"))
})

export{deleteComment,updateComment,addComment,getVideoComments}