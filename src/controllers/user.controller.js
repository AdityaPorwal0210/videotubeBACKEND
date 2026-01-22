import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    const {fullName, email, username, password } = req.body
    console.log("email: ", email);

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
console.log("before existedUser")
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   console.log("before user creation")

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })
    console.log("before createdUser")
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )

const generateAccessAndRefreshTokens = async(userId)=>{
    try {
    const user = await User.findById(userId)
    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()

    user.refreshToken=refreshToken
    await user.save({ validateBeforeSave: false })
    return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(405,"error while generating tokens")
    }
    
}

const loginUser = asyncHandler(async(req,res)=>{
    //get data from body
    //check if not empty
    //find user
    //if not found error
    //found =>validate password else error
    //generate tokens
    //set refresh token
    //set cookie
    // return res and send cookie
    const {username,password,email}=req.body
      
    if(!username && !email){
        throw new ApiError(400,"user credentials required")
    }
console.log(email)
    const user = await User.findOne({
        $or:[{username},{email}],
    })

    if(!user){
        throw new ApiError(401,"user does not exists")
    }
console.log("before user validation")
    const uservalidate = await user.isPasswordCorrect(password)
console.log("after validation")
    if(!uservalidate){
        throw new ApiError(404,"incorrect password")
    }
    console.log("after validation")
    const {refreshToken,accessToken}= await generateAccessAndRefreshTokens(user._id)
    console.log("after token generator")
    const options = {
        httpOnly: true,
        secure: true
    }
console.log("before user loggedin")
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    return res.status(200)
    .cookie("refreshToken",refreshToken,options)
    .cookie("accessToken",accessToken,options)
    .json(new ApiResponse(
        200,
        {user: loggedInUser, accessToken, refreshToken},
        "User logged In Successfully"
    ))

})

const logoutUser = asyncHandler(async (req,res)=>{
await User.findByIdAndUpdate(req.user._id,
    {
        $set:{
            refreshToken: undefined
        }
    },
    {
        new:true
    }
)
const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,"user loggedOut successfully"))
})

const refreshAccessToken = asyncHandler(async (req,res)=>{
    //get token
    //verify
    //find user by id from decodedtoken
    //generate new tokens
    //set res.cookie
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
      throw new ApiError(401,"refresh token access denied")
    }

    try {
        const decodedRefreshToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        if(!decodedRefreshToken){
            throw new ApiError(402,"invalid refresh token ")
        }
    
        const user = User.findById(decodedRefreshToken?._id)
        if(!user){
            throw new ApiError(403,"error while finding user")
        }
        
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }

        const {newRefreshToken,accessToken} = await generateAccessAndRefreshTokens(user._id)
        const options = {
            httpOnly: true,
            secure: true
        }
        return res
        .status(200)
        .cookie("refreshToken",newRefreshToken,options)
        .cookie("accessToken",accessToken,options)
        .json(new ApiResponse(
            200,
            {accessToken,refreshToken: newRefreshToken},
            "User logged In Successfully"
        ))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    //we will add middleware of auth.middleware with this route so we will get user from req.user
    //get old and new pass from req.user
    //find user by req.user._id
    //check if pass == this.pass with the help of isPasscorrect
    //set password = newPassword
    //user.save
    //return res.
    const {oldPassword,newPassword}=req.body

    const user = await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(401,"user not found")
    }
    const checkPassword = await user.isPasswordCorrect(oldPassword)
    if(!checkPassword){
        throw new ApiError(402,"invalid old password")
    }
    user.password=newPassword
    await user.save({validateBeforeSave:false})
    return res.status(200)
    .json(200,{},"password changed successfully")
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(200,req.user,"user found successfully")
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    //we will use auth middleware to verify user
    const {fullName,email} = req.body
    if(!fullName&&!email){
        throw new ApiError(400,"fullname or email must be present")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {$set:{
         fullName,
         email:email
         }}
    ,{new:true}).select("-password")
    return res.status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(401,"error while fetchng avatar")
    }

    // fs.unlinkSync(req.user?.avatar.path)

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(402,"error while uploading on cloudianry")
    }
    
    const user = await User.findByIdAndUpdate(req.user._id,
        {$set:{
            avatar:avatar.url
        }},
        {new:true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"avatar uploaded successfully"))
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(401,"error while fetchng coverImage")
    }

    // fs.unlinkSync(req.user?.avatar.path)

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(402,"error while uploading on cloudianry")
    }
    
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
            coverImage:coverImage.url
        }
       },
        {new:true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"coverImage uploaded successfully"))
})


export {updateUserCoverImage,updateUserCoverImage,registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar}