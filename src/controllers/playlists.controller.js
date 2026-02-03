import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {v2 as cloudinary} from "cloudinary"
import { uploadOnCloudinary } from "../utils/cloudinary";

const createPlaylist = asyncHandler(async(req,res)=>{
    //verify auth
    const userId = req.user?._id
    const {description,name} = req.body
    if(!name|| name.trim().length === 0){
        throw new ApiError(401,"name of the playlist required")
    }
    const existingPlaylist = await Playlist.findOne({name:name.trim(),owner:userId})
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
    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400,"playlistId not found")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400,"playlist not found")
    }
    return res.status(200).json(new ApiResponse(200,playlist,"playlist found"))
})

export const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "user not found");
  }

  const { videoId, playlistId } = req.params;

  if (
    !mongoose.Types.ObjectId.isValid(videoId) ||
    !mongoose.Types.ObjectId.isValid(playlistId)
  ) {
    throw new ApiError(400, "invalid videoId or playlistId");
  }

  const playlist = await Playlist.findOneAndUpdate(
    { _id: playlistId, owner: userId },
    {
      $addToSet: {                                      
        videos: new mongoose.Types.ObjectId(videoId), 
      },
    },
    { new: true }
  ).populate({
    path: "videos",
    select: "title thumbnail videoFile views createdAt",
  });

  if (!playlist) {
    throw new ApiError(404, "playlist not found or access denied");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist updated"));
});


export const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req.params;

  if (
    !mongoose.Types.ObjectId.isValid(videoId) ||
    !mongoose.Types.ObjectId.isValid(playlistId)
  ) {
    throw new ApiError(400, "invalid videoId or playlistId"); 
  }

  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "user not found");
  }

  const playlist = await Playlist.findOneAndUpdate(
    { _id: playlistId, owner: userId },                
    {
      $pull: { videos: new mongoose.Types.ObjectId(videoId) }, 
    },
    { new: true }
  ).populate({
    path: "videos",
    select: "title thumbnail videoFile views createdAt",
  });

  if (!playlist) {
    throw new ApiError(404, "playlist not found or access denied"); 
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "video deleted successfully"));
});


const deletePlaylist = asyncHandler(async(req,res)=>{
    // verify user with auth
    const userId = req.user?._id
    if(!userId){
        throw new ApiError(401,"user not found")
    }
    const {playlistId}= req.params
    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(401,"playlistId not found")
    }
    const deletedPlaylist = await Playlist.findOneAndDelete({
    _id: playlistId,
    owner: userId,
    });

  if (!deletedPlaylist) {
    throw new ApiError(404, "playlist not found or access denied");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "playlist deleted successfully"));

})

 const updatePlaylist = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "user not found");
  }

  const { playlistId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(playlistId)) {   // ❌ before: only !playlistId
    throw new ApiError(400, "invalid playlistId");
  }

  const { name, description } = req.body;

  // ❌ before: always set name & description, even if undefined
  const updateData = {};                                // ✅ update only provided fields
  if (name) updateData.name = name;
  if (description) updateData.description = description;

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    { _id: playlistId, owner: userId },                 // ✅ ownership check
    updateData,
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(404, "error while updating playlist"); // ❌ before: 401
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "playlist updated successfully")
    );
});


export {updatePlaylist,deletePlaylist,removeVideoFromPlaylist,addVideoToPlaylist,getPlaylistById,getUserPlaylists,createPlaylist}