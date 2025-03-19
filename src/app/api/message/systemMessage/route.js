import Message from "@/models/Message";
import { dbConnect } from "@/dbConfig/dbConfig";
import ApiResponse from "@/helpers/ApiResponse";
import mongoose from "mongoose";
import Chat from "@/models/Chat";

export async function POST(req) {

    await dbConnect();

    const { chatname, text, id } = await req.json();

    if(!text){
        return new ApiResponse("Message body is required", null, false, 400);
    }

    if(!chatname){
        return new ApiResponse("Chatname is required", null, false, 400);
    }

    const chat = await Chat.findOne({chatname});

    const message = new Message({
        text,
        id,
        isSystemMessage: true,
        sendTo: chat._id,
        sendBy: new mongoose.Types.ObjectId(userId)
    });

    await message.save();

    return new ApiResponse("Message sent successfully", null, true, 200);
}