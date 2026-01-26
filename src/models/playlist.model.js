import mongoose from "mongoose";
import { Schema } from "mongoose";

const playlistSchema = new Schema(
    {
        name:{
         type:String,
         required:true
        },
        discription:{
          type:String,
        },
        owner:{
          type:Schema.Types.ObjectId(),
          ref:"User",
          required:true
        },
        videos:[
            {
                type:Schema.Types.ObjectId(),
                ref:"Video",
                
            }
        ]

    }
    ,{timestamps:true})