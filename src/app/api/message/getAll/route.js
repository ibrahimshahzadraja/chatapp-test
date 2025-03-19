import Message from "@/models/Message";
import { dbConnect } from "@/dbConfig/dbConfig";
import ApiResponse from "@/helpers/ApiResponse";
import mongoose from "mongoose";
import Chat from "@/models/Chat";
import auth from "@/helpers/auth";

export async function POST(req) {

  await dbConnect();

  const authData = await auth(req);
  const userId = req.userId;
  
  if(!authData.isAuthorized || !userId) {
    return new ApiResponse("Unauthorized", null, false, 401);
  }

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
            $cond: {
              if: { $eq: ["$sendBy", new mongoose.Types.ObjectId(userId)] },
              then: true,
              else: false
            }
          },
          isReply: {
            $cond: {
              if: { $ne: ["$replyTo", ""] },
              then: true,
              else: false
            }
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
        $lookup: {
          from: "messages",
          localField: "replyTo",
          foreignField: "id",
          as: "replyMessage",
          pipeline: [
            { 
              $project: { 
                text: 1,
                "image.imageUrl": 1,
                "video.videoUrl": 1,
                "file.fileUrl": 1,
                "file.fileName": 1,
                _id: 0 
              } 
            }
          ]
        }
      },
      {
        $unwind: "$userDetails"
      },
      {
        $unwind: {
          path: "$replyMessage",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          sendTo: new mongoose.Types.ObjectId(chatId)
        }
      },
      {
        $project: {
          id: 1,
          text: 1,
          image: 1,
          voice: 1,
          video: 1,
          file: 1,
          isSentByMe: 1,
          isSystemMessage: 1,
          isReply: 1,
          replyUsername: 1,
          replyText: {
            $cond: {
              if: { $ne: ["$replyTo", ""] },
              then: "$replyMessage.text",
              else: ""
            }
          },
          replyImage: {
            $cond: {
              if: { $ne: ["$replyTo", ""] },
              then: "$replyMessage.image.imageUrl",
              else: ""
            }
          },
          replyVideo: {
            $cond: {
              if: { $ne: ["$replyTo", ""] },
              then: "$replyMessage.video.videoUrl",
              else: ""
            }
          },
          replyFile: {
            $cond: {
              if: { $ne: ["$replyTo", ""] },
              then: {
                fileUrl: {
                  $cond: {
                    if: { $eq: ["$replyMessage.file.fileUrl", ""] },
                    then: "",
                    else: "$replyMessage.file.fileUrl"
                  }
                },
                fileName: {
                  $cond: {
                    if: { $eq: ["$replyMessage.file.fileName", ""] },
                    then: "",
                    else: "$replyMessage.file.fileName"
                  }
                }
              },
              else: {
                fileUrl: "",
                fileName: ""
              }
            }
          },
          username: "$userDetails.username",
          createdAt: 1
        }
      }
    ]);    
      
      
  
  if (!messages) {
      return new ApiResponse("No messages found", null, false, 400);
  }
  
  const response = new ApiResponse("Messages found successfully", messages, true, 200);  
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