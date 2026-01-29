import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { Playlist } from "../models/playlist.model";
import { asyncHandler } from "../utils/asyncHandler";
import {v2 as cloudinary} from "cloudinary"
import { uploadOnCloudinary } from "../utils/cloudinary";

const createPlaylist = asyncHandler(async(req,res)=>{
    //verify auth
    const userId = req.user._id
    const {description,name} = req.body
    if(!name){
        throw new ApiError(401,"name of the playlist required")
    }
    const existingPlaylist = await Playlist.findOne({name:name,owner:userId})
    if(existingPlaylist){
        throw new ApiError(404,"playlist with this name already exist")
    }

    try {
        const newPlaylist = await Playlist.create({
            name:name,
            description:description,
            owner:userId,
            videos:[]
        })
        return res.status(200)
        .json(new ApiResponse(200,newPlaylist,"new playlist created successfully"))
    } catch (error) {
        throw new ApiError(405,"error while creating a new playlist")
    }
    
})

const getUserPlaylists = asyncHandler(async(req,res)=>{
    //verify auth
    const userId=req.user?._id
    if (!mongoose.Types.ObjectId.isValid(userId)) {
         throw new ApiError(400, "Invalid user ID");
    }
    try {
        const userPlaylists = await Playlist.aggregate([
            {
                $match:{
                    owner:new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $project:{
                    name:1,
                    description:1,
                    videos:1
                }
            }
        ])
        return res.status(200)
        .json(new ApiResponse(200,userPlaylists,"user playlists fetched successfully"))
    } catch (error) {
        throw new ApiError(405,"error while fetching user palylists")
    }
    
})

const getPlaylistById = asyncHandler(async(req,res)=>{
    const {playlistId}= req.params
    if(!playlistId){
        throw new ApiError(400,"playlistId not found")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400,"playlist not found")
    }
    return res.status(200).json(new ApiResponse(200,playlist,"playlist found"))
})

const addVideoToPlaylist = asyncHandler(async(req,res)=>{
    // verify with auth
    const userId = req.user?._id
    if(!userId){
        throw new ApiError(400,"userId not found")
    }
    const {playlistId}=req.params
    if(!playlistId){
        throw new ApiError(400,"playlistId not found")
    }
    const videoLocalPath=req.files?.video[0]?.path
    if(!videoLocalPath){
        throw new ApiError(400,"videoLocalPath not found")
    }
    const video = await uploadOnCloudinary(videoLocalPath)
    if(!video){
        throw new ApiError(400,"video upload failed")
    }
    const playlist = await Playlist.findOneAndUpdate({
        _id:playlistId,
        owner:userId
        },
        {
            $push:{
                videos:{
                    videoFile:video.url
                }
            }
        },
        { new: true }
    )
    if(!playlist){
        throw new ApiError(400,"playlist update failed")
    }
    return res.status(200).
    json(new ApiResponse(200,playlist,"playlist updated"))
})

const removeVideoFromPlaylist = asyncHandler(async(req,res)=>{
    //veify auth
    const {videoId,playlistId}=req.params
    if(!videoId||!playlistId){
        throw new ApiError(400,"please give proper input")
    }
    const userId = req.user?._id
    if(!userId){
        throw new ApiError(401,"user not found")
    }
    const playlist = await Playlist.findOneAndUpdate(
    {
      _id: playlistId,
      owner: userId
    },
    {
      $pull: {
        videos: { _id: videoId }
      }
    },
    { new: true }
    );
//     const playlist = await Playlist.findOne({
//     _id: playlistId,
//     owner: userId
//   });
    if(!playlist){
        throw new ApiError(402,"playlist not found")
    }
    // playlist.videos = playlist.videos.filter((video)=>video._id.toString()!==videoId.toString())
    // await playlist.save()
    return res.status(200)
    .json(new ApiResponse(200,playlist,"video delelted successfully"))
})

const deletePlaylist = asyncHandler(async(req,res)=>{
    // verify user with auth
    const userId = req.user?._id
    if(!userId){
        throw new ApiError(401,"user not found")
    }
    const {playlistId}= req.params
    if(!playlistId){
        throw new ApiError(401,"playlistId not found")
    }
    try {
        const deletedPlaylist = await Playlist.findOneAndDelete({_id:playlistId,owner:userId})
        return res.status(200).json(new ApiResponse(200,null,"playlist deleted successfully"))
    } catch (error) {
        throw new ApiError(405,error.message||"error while deleting playlist")
    }

})

const updatePlaylist = asyncHandler(async(req,res)=>{
    //verify auth
    const userId = req.user?._id
    if(!userId){
        throw new ApiError(401,"user not found")
    }
    const {playlistId}= req.params
    if(!playlistId){
        throw new ApiError(401,"playlistId not found")
    }
    const {name,description}=req.body
    const updatedPlaylist = await Playlist.findOneAndUpdate({_id:playlistId,owner:userId},{name:name,description:description},{new:true})
    if(!updatedPlaylist){
        throw new ApiError(401,"error while updating playlist")
    }
    return res.status(200).json(new ApiResponse(200,updatedPlaylist,"playlist updated successfully"))
})

export {updatePlaylist,deletePlaylist,removeVideoFromPlaylist,addVideoToPlaylist,getPlaylistById,getUserPlaylists,createPlaylist}