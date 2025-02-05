import Chat from "@/models/Chat";
import ApiResponse from "@/helpers/ApiResponse";
import { dbConnect } from "@/dbConfig/dbConfig";
import mongoose from "mongoose";
import auth from "@/helpers/auth";

export async function POST(req) {

    const isAuthenticated = await auth(req);
    const userId = req.userId;
    if(!isAuthenticated || !userId) {
        return new ApiResponse("Unauthorized", null, false, 401);
    }

    await dbConnect();

    const { chatname } = await req.json()

    if(!chatname) {
        return new ApiResponse("Chatname is required", null, false, 400);
    }
    
    const chat = await Chat.findOne({chatname});

    if(chat.banned.includes(new mongoose.Types.ObjectId(userId))){
        return new ApiResponse("User is banned", null, false, 400);
    }
    
    if(!chat){
        return new ApiResponse("Chat doesn't exists", null, false, 400);
    }

    const isMember = chat.owner.toString() == userId || chat.members.includes(new mongoose.Types.ObjectId(userId))
    const isOwner = chat.owner.toString() == userId

    if(!isMember){
        return new ApiResponse("Access denied", null, false, 400);
    }

    return new ApiResponse("Access granted", {isMember, isOwner}, true, 200);

}