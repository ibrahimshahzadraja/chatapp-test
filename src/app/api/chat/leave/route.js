import ApiResponse from "@/helpers/ApiResponse";
import { dbConnect } from "@/dbConfig/dbConfig";
import Chat from "@/models/Chat";
import auth from "@/helpers/auth";
import mongoose from "mongoose";

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
      

    return new ApiResponse("Room left successfully", null, true, 200);
      
}