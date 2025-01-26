import { dbConnect } from "@/dbConfig/dbConfig";
import ApiResponse from "@/helpers/ApiResponse";
import User from "@/models/User";
import mongoose from "mongoose";

export async function GET(req){
    await dbConnect();

    const requestHeaders = new Headers(req.headers);
    const userId = requestHeaders.get('x-user-id');

    const user = await User.findOne({_id: new mongoose.Types.ObjectId(userId)}).select("-password -refreshToken");

    if(!user){
        return new ApiResponse("User not found", null, false, 400)
    }

    return new ApiResponse("User found", user, true, 200);
}