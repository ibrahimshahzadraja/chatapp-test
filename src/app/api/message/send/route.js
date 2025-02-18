import Message from "@/models/Message";
import { dbConnect } from "@/dbConfig/dbConfig";
import ApiResponse from "@/helpers/ApiResponse";
import mongoose from "mongoose";
import Chat from "@/models/Chat";
import auth from "@/helpers/auth";
import { encrypt } from "@/utils/encryption";

export async function POST(req) {

    const isAuthenticated = await auth(req);
    const userId = req.userId;
    if(!isAuthenticated || !userId) {
        return new ApiResponse("Unauthorized", null, false, 401);
    }

    await dbConnect();

    const { text, chatname } = await req.json();

    if(!text){
        return new ApiResponse("Message body is required", null, false, 400);
    }

    if(!chatname){
        return new ApiResponse("Chatname is required", null, false, 400);
    }

    const chat = await Chat.findOne({chatname});

    const encryptedText = encrypt(text);

    const message = new Message({
        text: encryptedText,
        sendTo: chat._id,
        sendBy: new mongoose.Types.ObjectId(userId)
    });

    await message.save();

    return new ApiResponse("Message sent successfully", null, true, 200);
}