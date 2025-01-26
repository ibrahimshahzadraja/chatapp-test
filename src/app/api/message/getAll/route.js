import Message from "@/models/Message";
import { dbConnect } from "@/dbConfig/dbConfig";
import ApiResponse from "@/helpers/ApiResponse";
import mongoose from "mongoose";
import Chat from "@/models/Chat";
import User from "@/models/User";

export async function POST(req) {
    await dbConnect();

    const requestHeaders = new Headers(req.headers);
    const userId = requestHeaders.get('x-user-id');

    const { chatname } = await req.json();

    if(!chatname){
        return new ApiResponse("Chatname is required", null, false, 400);
    }

    const chat = await Chat.findOne({chatname})

    if(!chat){
        return new ApiResponse("Chat not found", null, false, 400);
    }

    const chatId = chat._id;

    if(!chatId){
        return new ApiResponse("No chat found", null, false, 400);
    }

    const username = (await User.findOne({_id: new mongoose.Types.ObjectId(userId)})).username;

    const messages = await Message.aggregate([
        {
          $addFields: {
            isSentByMe: {
              $cond: { if: { $eq: ["$sendBy", new mongoose.Types.ObjectId(userId)] }, then: true, else: false }
            },
            username,
          }
        },
        {
          $match: {
            sendTo: new mongoose.Types.ObjectId(chatId)
          }
        },
        {
          $project: {
            text: 1,
            isSentByMe: 1,
            username: 1,
            createdAt: 1
          }
        }
      ]);

    if(!messages){
        return new ApiResponse("No messages found", null, false, 400);
    }

    return new ApiResponse("Messages found successfully", messages, true, 200);

}