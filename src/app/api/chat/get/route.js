import ApiResponse from "@/helpers/ApiResponse";
import Chat from "@/models/Chat";
import { dbConnect } from "@/dbConfig/dbConfig";
import mongoose from "mongoose";
import auth from "@/helpers/auth";

export async function POST(req) {

    const isAuthenticated = await auth(req);
    const userId = req.userId;
    if(!isAuthenticated || !userId) {
        return new ApiResponse("Unauthorized", null, false, 401);
    }

    await dbConnect();

    const {chatname} = await req.json();

    if(!chatname){
        return new ApiResponse("Chatname is required", null, false, 400);
    }

    const chat = await Chat.aggregate([
      {
        $match: {
          chatname: chatname
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "ownerDetails"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "members",
          foreignField: "_id",
          as: "memberDetails"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "banned",
          foreignField: "_id",
          as: "bannedDetails"
        }
      },
      {
        $project: {
          chatname: 1,
          profilePicture: 1,
          backgroundImage: 1,
          "ownerUsername": { $arrayElemAt: ["$ownerDetails.username", 0] },
          memberUsernames: {
            $concatArrays: [
              [{ $arrayElemAt: ["$ownerDetails.username", 0] }],
              "$memberDetails.username"
            ]
          },
          "bannedUsernames": "$bannedDetails.username"
        }
      }
    ]);

    if(!chat){
        return new ApiResponse("Chat not found", null, false, 400);
    }

    return new ApiResponse("Chat found", chat, true, 200);

}