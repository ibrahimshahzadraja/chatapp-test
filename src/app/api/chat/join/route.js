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

    const { chatname, password } = await req.json();

    if(!chatname || !password){
        return new ApiResponse("Chatname and Password are required", null, false, 400);
    }
    
    const chat = await Chat.findOne({chatname});
    
    if(!chat){
        return new ApiResponse("Chat not found", null, false, 400);
    }

    const isPasswordCorrect = await chat.comparePassword(password);

    if(!isPasswordCorrect){
        return new ApiResponse("Wrong password", null, false, 400);
    }

    if(chat.members.includes(userId) || chat.owner.toString() == userId){
        return new ApiResponse("Already a member", null, false, 400);
    }
    
    if(chat.banned.includes(new mongoose.Types.ObjectId(userId))){
        return new ApiResponse("User is banned", null, false, 400);
    }

    chat.members.push(userId);
    await chat.save();

    const response = new ApiResponse("Succefully joined the room", null, true, 200);

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