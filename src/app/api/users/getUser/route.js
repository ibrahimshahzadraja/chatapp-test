import { dbConnect } from "@/dbConfig/dbConfig";
import ApiResponse from "@/helpers/ApiResponse";
import User from "@/models/User";
import mongoose from "mongoose";
import auth from "@/helpers/auth";

export async function GET(req){
    
    const isAuthenticated = await auth(req);
    const userId = req.userId;
    
    if(!isAuthenticated || !userId){
        return new ApiResponse("Unauthorized", null, false, 401);
    }
    
    await dbConnect();

    const user = await User.findOne({_id: new mongoose.Types.ObjectId(userId)})
        .select("-password -refreshToken");

    if(!user){
        return new ApiResponse("User not found", null, false, 400)
    }

    return new ApiResponse("User found", user, true, 200);
}