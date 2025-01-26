import Message from "@/models/Message";
import { dbConnect } from "@/dbConfig/dbConfig";
import ApiResponse from "@/helpers/ApiResponse";
import mongoose from "mongoose";

export async function POST(req) {
    await dbConnect();

    const requestHeaders = new Headers(req.headers);
    const userId = requestHeaders.get('x-user-id');

    const { messageId } = await req.json();

    if(!messageId){
        return new ApiResponse("Message id is required", null, false, 400);
    }

    console.log(messageId, userId);

    const message = await Message.findOneAndDelete({_id: new mongoose.Types.ObjectId(messageId), sendBy: new mongoose.Types.ObjectId(userId)});

    if(!message){
        return new ApiResponse("Message not found", null, false, 400);
    }

    return new ApiResponse("Message deleted successfully", null, true, 200);
}