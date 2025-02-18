import Message from "@/models/Message";
import { dbConnect } from "@/dbConfig/dbConfig";
import ApiResponse from "@/helpers/ApiResponse";
import mongoose from "mongoose";
import Chat from "@/models/Chat";
import auth from "@/helpers/auth";
import { decrypt } from "@/utils/encryption";

export async function POST(req) {

  const isAuthenticated = await auth(req);
  const userId = req.userId;
  if(!isAuthenticated || !userId) {
      return new ApiResponse("Unauthorized", null, false, 401);
  }

    await dbConnect();

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

    const messages = await Message.aggregate([
        {
          $addFields: {
            isSentByMe: {
              $cond: { if: { $eq: ["$sendBy", new mongoose.Types.ObjectId(userId)] }, then: true, else: false }
            }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "sendBy",
            foreignField: "_id",
            as: "userDetails",
            pipeline: [
              { $project: { username: 1, _id: 0 } }
            ]
          }
        },
        {
          $unwind: "$userDetails"
        },
        {
          $match: {
            sendTo: new mongoose.Types.ObjectId(chatId)
          }
        },
        {
          $project: {
            text: 1,
            image: 1,
            voice: 1,
            video: 1,
            file: 1,
            isSentByMe: 1,
            isSystemMessage: 1,
            username: "$userDetails.username",
            createdAt: 1
          }
        }
      ]);

    if(!messages){
        return new ApiResponse("No messages found", null, false, 400);
    }

    messages.map((message) => {
      if (message.text) {
        message.text = decrypt(message.text);
      }
      if(message.image.imageUrl){
        message.image.imageUrl = decrypt(message.image.imageUrl);
      }
      if(message.video.videoUrl){
        message.video.videoUrl = decrypt(message.video.videoUrl);
      }
      if(message.file.fileUrl){
        message.file.fileUrl = decrypt(message.file.fileUrl);
      }
      if(message.voice){
        message.voice = decrypt(message.voice);
      }
    });

    return new ApiResponse("Messages found successfully", messages, true, 200);

}