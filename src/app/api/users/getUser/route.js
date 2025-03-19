import { dbConnect } from "@/dbConfig/dbConfig";
import ApiResponse from "@/helpers/ApiResponse";
import User from "@/models/User";
import mongoose from "mongoose";
import auth from "@/helpers/auth";

export async function GET(req){
    
    await dbConnect();

    const authData = await auth(req);
    const userId = req.userId;
    
    if(!authData.isAuthorized || !userId) {
        return new ApiResponse("Unauthorized", null, false, 401);
    }

    const user = await User.findOne({_id: new mongoose.Types.ObjectId(userId)})
        .select("-password -refreshToken");

    if(!user){
        return new ApiResponse("User not found", null, false, 400)
    }

    const response = new ApiResponse("User found", user, true, 200);

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