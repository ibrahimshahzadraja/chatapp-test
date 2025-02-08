import { dbConnect } from "@/dbConfig/dbConfig";
import ApiResponse from "@/helpers/ApiResponse";
import auth from "@/helpers/auth";
import Message from "@/models/Message";
import Chat from "@/models/Chat";
import { uploadOnCloudinary } from "@/lib/uploadOnCloudinary";
import mongoose from "mongoose";

export async function POST(req) {

    const isAuthenticated = await auth(req);
    const userId = req.userId;
    if(!isAuthenticated || !userId) {
        return new ApiResponse("Unauthorized", null, false, 401);
    }

    await dbConnect();

    const formData = await req.formData();
    const voice = formData.get('voice');
    const chatname = formData.get('chatname');

    console.log(voice);

    if(!voice){
        return new ApiResponse("Audio not found", null, false, 400);
    }

    if(!chatname){
        return new ApiResponse("Chatname is required", null, false, 400);
    }

    const url = await uploadOnCloudinary(voice);

    if(!url) {
        return new ApiResponse("Error uploading audio", null, false, 500);
    }

    const chat = await Chat.findOne({chatname});

    const message = new Message({
        voice: url,
        sendTo: chat._id,
        sendBy: new mongoose.Types.ObjectId(userId)
    });

    await message.save();

    return new ApiResponse("Image sent successfully", null, true, 200);
}