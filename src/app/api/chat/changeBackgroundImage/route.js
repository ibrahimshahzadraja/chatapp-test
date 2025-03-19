import Chat from "@/models/Chat";
import ApiResponse from "@/helpers/ApiResponse";
import { dbConnect } from "@/dbConfig/dbConfig";
import auth from "@/helpers/auth";
import { uploadOnCloudinary } from "@/lib/uploadOnCloudinary";

export async function POST(req) {

    await dbConnect();

    const authData = await auth(req);
    const userId = req.userId;
    
    if(!authData.isAuthorized || !userId) {
        return new ApiResponse("Unauthorized", null, false, 401);
    }
    
    const formData = await req.formData();
    const chatname = formData.get('chatname');
    const backgroundImage = formData.get('backgroundImage');

    if(!chatname) {
        return new ApiResponse("Chatname is required", null, false, 400);
    }

    if(!backgroundImage) {
        return new ApiResponse("Background Image is required", null, false, 400);
    }

    const chat = await Chat.findOne({chatname});

    if(!chat) {
        return new ApiResponse("Chat not found", null, false, 400);
    }

    if(chat.owner.toString() !== userId) {
        return new ApiResponse("Unauthorized", null, false, 401);
    }

    const url = await uploadOnCloudinary(backgroundImage);

    if(!url) {
        return new ApiResponse("Error uploading image", null, false, 500);
    }

    chat.backgroundImage = url;
    await chat.save({validateBeforeSave: false});

    const response = new ApiResponse("Background Image updated successfully", url, true, 200);

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