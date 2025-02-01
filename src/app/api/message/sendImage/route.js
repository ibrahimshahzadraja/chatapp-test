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
    const image = formData.get('image');
    const chatname = formData.get('chatname');

    if(!image){
        return new ApiResponse("Image not found", null, false, 400);
    }

    if(!chatname){
        return new ApiResponse("Chatname is required", null, false, 400);
    }

    const url = await uploadOnCloudinary(image);

    if(!url) {
        return new ApiResponse("Error uploading image", null, false, 500);
    }

    const chat = await Chat.findOne({chatname});

    const message = new Message({
        image: url,
        text: "",
        sendTo: chat._id,
        sendBy: new mongoose.Types.ObjectId(userId)
    });

    await message.save();

    return new ApiResponse("Image sent successfully", null, true, 200);
}