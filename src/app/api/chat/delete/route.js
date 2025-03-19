import ApiResponse from "@/helpers/ApiResponse";
import { dbConnect } from "@/dbConfig/dbConfig";
import Chat from "@/models/Chat";
import mongoose from "mongoose";
import Message from "@/models/Message";
import auth from "@/helpers/auth";

export async function POST(req){

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

    
    const chat = await Chat.findOne({chatname, owner: new mongoose.Types.ObjectId(userId)});
    const messages = await Message.deleteMany({sendTo: chat._id})

    if(!chat){
        return new ApiResponse("Chat not found", null, false, 400);
    }

    await chat.deleteOne();
    
    const response = new ApiResponse("Chat deleted", null, true, 200);

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