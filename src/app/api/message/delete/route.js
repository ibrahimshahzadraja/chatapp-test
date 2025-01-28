import Message from "@/models/Message";
import { dbConnect } from "@/dbConfig/dbConfig";
import ApiResponse from "@/helpers/ApiResponse";
import mongoose from "mongoose";
import auth from "@/helpers/auth";

export async function POST(req) {

    const isAuthenticated = await auth(req);
    const userId = req.userId;
    if(!isAuthenticated || !userId) {
        return new ApiResponse("Unauthorized", null, false, 401);
    }

    await dbConnect();

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