import jwt  from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";

export const verifyJWT = asyncHandler(async(req,res,next)=>{
    try {
        const token = await req.cookies?. accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if(!token){
            throw new ApiError(401,"unauthorized request")
        }
    
        const user = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        if(!user){
            throw new ApiError(402,"verification failed")
        }
    
        req.user=user
        next
    
    } catch (error) {
        throw new ApiError(404,error.message||"something went wrong in verifyJWT")
    }
})
