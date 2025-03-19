import ApiResponse from "@/helpers/ApiResponse";
import Chat from "@/models/Chat";
import { dbConnect } from "@/dbConfig/dbConfig";
import mongoose from "mongoose";
import auth from "@/helpers/auth";

export async function GET(req) {

	await dbConnect();

	const authData = await auth(req);
	const userId = req.userId;
	
	if(!authData.isAuthorized || !userId) {
		return new ApiResponse("Unauthorized", null, false, 401);
	}

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
          image: {
            $ifNull: [
              { $arrayElemAt: ["$messages.image", 0] },
              ""
            ]
          },
          voice: {
            $ifNull: [
              { $arrayElemAt: ["$messages.voice", 0] },
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

    const response = new ApiResponse("Chats found", chats, true, 200);

	if(authData.tokenChanged){
		response.cookies.set('accessToken', authData.accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			path: '/',
			sameSite: 'strict',
			maxAge: 3 * 24 * 60 * 60,
		});
		
		response.cookies.set('refreshToken', authData.refreshToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		sameSite: 'strict',
		maxAge: 365 * 24 * 60 * 60
		});
	}

	return response;
}