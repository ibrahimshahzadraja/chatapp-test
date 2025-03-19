import ApiResponse from "@/helpers/ApiResponse";
import { dbConnect } from "@/dbConfig/dbConfig";
import Chat from "@/models/Chat";
import auth from "@/helpers/auth";
import mongoose from "mongoose";

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

    const chat = await Chat.findOne({chatname});
    
    if(!chat){
        return new ApiResponse("Chat not found", null, false, 400);
    }

    if(!chat.members.includes(userId)){
        return new ApiResponse("You are not the member of this room", null, false, 400);
    }


    await Chat.updateOne(
        { chatname },
        {
          $pull: {
            members: userId,
            admins: new mongoose.Types.ObjectId(userId)
          }
        }
      );
      

    const response = new ApiResponse("Room left successfully", null, true, 200);

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