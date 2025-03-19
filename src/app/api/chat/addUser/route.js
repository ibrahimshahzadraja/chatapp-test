import Chat from "@/models/Chat";
import ApiResponse from "@/helpers/ApiResponse";
import { dbConnect } from "@/dbConfig/dbConfig";
import auth from "@/helpers/auth";
import User from "@/models/User";
import mongoose from "mongoose";

export async function POST(req) {

    await dbConnect();

    const authData = await auth(req);
    const userId = req.userId;
    
    if(!authData.isAuthorized || !userId) {
        return new ApiResponse("Unauthorized", null, false, 401);
    }
    
    const {chatname, username} = await req.json();

    if(!chatname){
        return new ApiResponse("Chatname is required", null, false, 400);
    }

    if(!username){
        return new ApiResponse("Username is required", null, false, 400);
    }

    const chat = await Chat.findOne({chatname});

    if(!chat){
        return new ApiResponse("Chat not found", null, false, 400);
    }

    const user = await User.findOne({username});

    if(!user){
        return new ApiResponse("User not found", null, false, 400);
    }

    if(chat.owner.toString() !== userId) {
        return new ApiResponse("Unauthorized", null, false, 401);
    }

    if(chat.owner.toString() == user._id.toString()){
        return new ApiResponse("Already a member", null, false, 400);
    }

    if(chat.members.includes(new mongoose.Types.ObjectId(user._id))){
        return new ApiResponse("Already a member", null, false, 400);
    }

    if(chat.banned.includes(new mongoose.Types.ObjectId(user._id))){
        return new ApiResponse("The user is banned", null, false, 400);
    }

    chat.members.push(user._id);
    await chat.save({validateBeforeSave: false});

    const response = new ApiResponse("User added successfully", null, true, 200);

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