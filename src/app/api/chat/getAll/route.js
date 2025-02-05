import ApiResponse from "@/helpers/ApiResponse";
import Chat from "@/models/Chat";
import { dbConnect } from "@/dbConfig/dbConfig";
import mongoose from "mongoose";
import auth from "@/helpers/auth";

export async function GET(req) {

  const isAuthenticated = await auth(req);
  const userId = req.userId;
  if(!isAuthenticated || !userId) {
      return new ApiResponse("Unauthorized", null, false, 401);
  }

    await dbConnect();

    const chats = await Chat.aggregate([
      {
        $match: {
          $and: [
            {
              $or: [
                { members: new mongoose.Types.ObjectId(userId) },
                { owner: new mongoose.Types.ObjectId(userId) }
              ]
            },
            {
              banned: { $nin: [new mongoose.Types.ObjectId(userId)] }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "messages",
          let: { chatId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$sendTo", "$$chatId"] },
                    { $eq: ["$isSystemMessage", false] }
                  ]
                }
              }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: "messages"
        }
      },
      {
        $lookup: {
          from: "users",
          let: { sendById: { $arrayElemAt: ["$messages.sendBy", 0] } },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$sendById"] } } },
            { $project: { username: 1 } }
          ],
          as: "sendByUser"
        }
      },
      {
        $project: {
          chatname: 1,
          profilePicture: 1,
          messageText: {
            $ifNull: [
              { $arrayElemAt: ["$messages.text", 0] },
              ""
            ]
          },
          sendByUsername: {
            $ifNull: [
              { $arrayElemAt: ["$sendByUser.username", 0] },
              ""
            ]
          },
          _id: 0
        }
      }
    ]);

    if(!chats){
        return new ApiResponse("No chat found", null, false, 400)
    }

    return new ApiResponse("Chats found", chats, true, 200);
}