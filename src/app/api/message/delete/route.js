import Message from "@/models/Message";
import { dbConnect } from "@/dbConfig/dbConfig";
import ApiResponse from "@/helpers/ApiResponse";
import mongoose from "mongoose";
import auth from "@/helpers/auth";

export async function POST(req) {

    await dbConnect();

    const authData = await auth(req);
    const userId = req.userId;
    
    if(!authData.isAuthorized || !userId) {
        return new ApiResponse("Unauthorized", null, false, 401);
    }

    const { messageId } = await req.json();

    if(!messageId){
        return new ApiResponse("Message id is required", null, false, 400);
    }

    console.log(messageId, userId);

    const message = await Message.findOneAndDelete({_id: new mongoose.Types.ObjectId(messageId), sendBy: new mongoose.Types.ObjectId(userId)});

    if(!message){
        return new ApiResponse("Message not found", null, false, 400);
    }

    const response = new ApiResponse("Message deleted successfully", null, true, 200);

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