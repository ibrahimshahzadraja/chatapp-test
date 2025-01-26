import ApiResponse from "@/helpers/ApiResponse";
import Chat from "@/models/Chat";
import { dbConnect } from "@/dbConfig/dbConfig";
import mongoose from "mongoose";

export async function GET(req) {
    await dbConnect();

    const requestHeaders = new Headers(req.headers);
    const userId = requestHeaders.get('x-user-id');

    const chats = await Chat.aggregate([
        {
            $match: {
              $or: [
                { members: new mongoose.Types.ObjectId(userId) },
                { owner: new mongoose.Types.ObjectId(userId) }
              ]
            }
          },
          {
            $project: {
              chatname: 1,
              _id: 0
            }
          },
          {
            $group: {
              _id: null,
              chatnames: { $push: "$chatname" }
            }
          },
          {
            $project: {
              _id: 0,
              chatnames: 1
            }
          }
        ])

    if(!chats){
        return new ApiResponse("No chat found", null, false, 400)
    }

    const chatnamesArray = chats.length > 0 ? chats[0].chatnames : [];

    return new ApiResponse("Chats found", chatnamesArray, true, 200);
}