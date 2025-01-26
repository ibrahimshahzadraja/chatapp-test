import Chat from "@/models/Chat";
import ApiResponse from "@/helpers/ApiResponse";
import { dbConnect } from "@/dbConfig/dbConfig";
import mongoose from "mongoose";

export async function POST(req) {
    await dbConnect();

    const requestHeaders = new Headers(req.headers);
    const userId = requestHeaders.get('x-user-id');

    const { chatname } = await req.json()

    if(!chatname) {
        return new ApiResponse("Chatname is required", null, false, 400);
    }
    
    const chat = await Chat.findOne({chatname});
    
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