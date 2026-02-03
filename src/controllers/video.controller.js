import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import {v2 as cloudinary} from "cloudinary"
import { uploadOnCloudinary } from "../utils/cloudinary";
import { Video } from "../models/video.model";
import { ApiResponse } from "../utils/ApiResponse";
const getAllVideos = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    // Convert to numbers
    page = parseInt(page);
    limit = parseInt(limit);

    if (page <= 0 || limit <= 0) {
        throw new ApiError(400, "page and limit must be positive integers");
    }

    // 1. Build match stage (search + filter)
    const matchStage = {
        isPublished: true, // show only published videos in public API
    };

    if (query && query.trim() !== "") {
        matchStage.title = {
            $regex: query.trim(),
            $options: "i", // case-insensitive
        };
    }

    if (userId) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiError(400, "Invalid userId");
        }
        matchStage.owner = new mongoose.Types.ObjectId(userId);
    }

    // 2. Build sort stage
    // Allow sortBy: "createdAt", "views", "duration", etc.
    // sortType: "asc" | "desc"
    const sortStage = {};
    const allowedSortFields = ["createdAt", "views", "duration", "title"]; // adjust as per your schema

    if (sortBy && allowedSortFields.includes(sortBy)) {
        const sortDirection = sortType === "asc" ? 1 : -1; // default desc
        sortStage[sortBy] = sortDirection;
    } else {
        // default sort: newest first
        sortStage.createdAt = -1;
    }

    const skip = (page - 1) * limit;

    const pipeline = [
        { $match: matchStage },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            },
        },
        {
            $unwind: {
                path: "$owner",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                videoFile: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                "owner._id": 1,
                "owner.username": 1,
                "owner.fullName": 1,
                "owner.avatar": 1,
            },
        },
        { $sort: sortStage },
        {
            $facet: {
                data: [
                    { $skip: skip },
                    { $limit: limit },
                ],
                totalCount: [
                    { $count: "count" },
                ],
            },
        },
    ];

    const result = await Video.aggregate(pipeline);

    const videos = result[0]?.data || [];
    const totalDocs = result[0]?.totalCount?.[0]?.count || 0;
    const totalPages = Math.ceil(totalDocs / limit) || 1;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                videos,
                page,
                limit,
                totalDocs,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
            "Videos fetched successfully"
        )
    );
});

const publishVideo = asyncHandler(async(req,res)=>{
    //verify
    const userId = req.user?._id
    if(!userId){
        throw new ApiError(400,"userId not found")
    }
    const {title,description}=req.body
    if(!title || !description){
        throw new ApiError(400,"video details not found")
    }
    const videoLocalPath = req.files?.video[0].path
    const thumbnailLocalPath=req.files?.thumbnail[0].path
    if(!videoLocalPath){
        throw new ApiError(400,"videoLocalPath not found")
    }
    const video = await uploadOnCloudinary(videoLocalPath)
    if(!video){
        throw new ApiError(404,"error while uploading video on cloudinary")
    }
    if(!thumbnailLocalPath){
        throw new ApiError(400,"thumbnailLocalPath not found")
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if(!thumbnail){
        throw new ApiError(404,"error while uploading thumbnail on cloudinary")
    }
    const newVideo = await Video.create({
        videoFile:video.url,
        thumbnail:thumbnail,
        title:title,
        description:description,
        duration:video.duration,
        views:0,
        isPublished:true,
        owner:userId,
    })
     if(!newVideo){
        throw new ApiError(404,"error while creating newVideo ")
    }
    return res.status(200).json(new ApiResponse(200,newVideo,"new video created successfully"))
})

const getVideoById = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    if(!videoId){
        throw new ApiError(404,"videoId not found")
    }
    const video = await Video.findById(videoId).select("-isPublished")
    if(!video){
        throw new ApiError(407,"video not found")
    }
    return res.status(200).json(new ApiResponse(200,video,"video fetched successfully"))
})

const updateVideo = asyncHandler(async(req,res)=>{
    //verify user
    const userId = req.user?._id
    if(!userId){
        throw new ApiError(400,"userId not found")
    }
    const videoId = req.params
    if(!videoId){
        throw new ApiError(401,"video Id not found")
    }
    const {title,description}=req.body
    const thumbnailLocalPath = req.files?.thumbnail[0].path
    const oldthumbnail = await Video.findOne({_id:videoId,owner:userId}).thumbnail
    const thumbnail=oldthumbnail;
    if(thumbnailLocalPath){
         thumbnail= await uploadOnCloudinary(thumbnailLocalPath)
    }
    const updatedVideo = await Video.findByIdAndUpdate(videoId,{
        if(title){
            title:title
        },
        if(description){
            description:description
        },
        if(thumbnail){
            thumbnail:thumbnail.url
        } 
    })
    if(thumbnailLocalPath){
        try {
            await cloudinary.uploader.destroy(oldthumbnail)
        }
        catch (error) {
            throw new ApiError(400,error.message)
        }
    } 
    return res.status(200).json(new ApiResponse(200,updatedVideo,"video details updated successfully"))
})

const deleteVideo = asyncHandler(async(req,res)=>{
    //verify
    const userId = req.user?._id
    if(!userId){
        throw new ApiError(400,"userId not found")
    }
    const videoId = req.params
    if(!videoId){
        throw new ApiError(401,"video Id not found")
    }
    const deletedVideo = await Video.findOneAndDelete({_id:videoId,owner:userId})
    if(!deletedVideo){
        throw new ApiError(404,"deletion failed")
    }
    return res.status(200).json(new ApiResponse(200,null,"video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
     const userId = req.user?._id
        if(!videoId){
            throw new ApiError(401,"videoId is invalid")
        }
        if(!userId){
            throw new ApiError(401,"userId is invalid")
        }
    
        const video = await Video.findOneAndUpdate(
            {_id:videoId,owner:userId},
            [
             { $set: { isPublished: { $not: "$isPublished" } } }
            ],{new:true}
        )
        if (!video) throw new ApiError(404, "Video not found");
        return res.status(200).json(new ApiResponse(200,video,"liked this video successfully"))
})

export{getAllVideos,togglePublishStatus,deleteVideo,publishVideo,updateVideo,getVideoById}