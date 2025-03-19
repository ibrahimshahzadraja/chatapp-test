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

    const { text, chatname, replyId, id, replyUsername } = await req.json();

    if(!text){
        return new ApiResponse("Message body is required", null, false, 400);
    }

    if(!chatname){
        return new ApiResponse("Chatname is required", null, false, 400);
    }

    if(!id){
        return new ApiResponse("Message id is required", null, false, 400);
    }

    const chat = await Chat.findOne({chatname});

    let message;

    if(replyId){
        message = new Message({
            id,
            text,
            replyTo: replyId,
            replyUsername,
            sendTo: chat._id,
            sendBy: new mongoose.Types.ObjectId(userId)
        });
    } else{
        message = new Message({
            id,
            text,
            sendTo: chat._id,
            sendBy: new mongoose.Types.ObjectId(userId)
        });
    }

    await message.save();

    const response = new ApiResponse("Message sent successfully", null, true, 200);
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
		sameSite: 'lax',
		maxAge: 365 * 24 * 60 * 60
		});
	}

	return response;
}