import Chat from "@/models/Chat";
import ApiResponse from "@/helpers/ApiResponse";
import { dbConnect } from "@/dbConfig/dbConfig";
import mongoose from "mongoose";
import auth from "@/helpers/auth";
import User from "@/models/User";

export async function POST(req) {

    const isAuthenticated = await auth(req);
    const userId = req.userId;
    if(!isAuthenticated || !userId) {
        return new ApiResponse("Unauthorized", null, false, 401);
    }

    await dbConnect();

    const { chatname, username } = await req.json()

    if(!chatname) {
        return new ApiResponse("Chatname is required", null, false, 400);
    }
    
    const chat = await Chat.findOne({chatname});
    
    if(!chat){
        return new ApiResponse("Chat not found", null, false, 400);
    }

    const user = await User.findOne({ username });

    if (!user) {
        return new ApiResponse("User not found", null, false, 400);
    }

    if(chat.admins.includes(new mongoose.Types.ObjectId(user._id))){
        chat.admins.pull(new mongoose.Types.ObjectId(user._id));
        await chat.save();
        return new ApiResponse("Admin removed successfully", null, true, 200);
    } else{
        chat.admins.push(new mongoose.Types.ObjectId(user._id));
        await chat.save();
        return new ApiResponse("Admin created successfully", null, true, 200);
    }



}