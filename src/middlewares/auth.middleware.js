import jwt  from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/user.model";
export const verifyJWT = asyncHandler(async(req,res,next)=>{
    try {
        const token = await req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if(!token){
            throw new ApiError(401,"unauthorized request")
        }
    
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if(!user){
            throw new ApiError(402,"verification failed")
        }
    
        req.user=user
        next()
    
    } catch (error) {
        throw new ApiError(404,error.message||"something went wrong in verifyJWT")
    }
})
