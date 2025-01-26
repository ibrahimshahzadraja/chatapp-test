import ApiResponse from "@/helpers/ApiResponse";
import { dbConnect } from "@/dbConfig/dbConfig";
import Chat from "@/models/Chat";
import mongoose from "mongoose";
import Message from "@/models/Message";

export async function POST(req){
    await dbConnect();

    const { chatname } = await req.json();

    if(!chatname){
        return new ApiResponse("Chatname is required", null, false, 400);
    }

    const requestHeaders = new Headers(req.headers);
    const userId = requestHeaders.get('x-user-id');
    
    const chat = await Chat.findOne({chatname, owner: new mongoose.Types.ObjectId(userId)});
    const messages = await Message.deleteMany({sendTo: chat._id})

    if(!chat){
        return new ApiResponse("Chat not found", null, false, 400);
    }

    await chat.deleteOne();
    
    return new ApiResponse("Chat deleted", null, true, 200);
}