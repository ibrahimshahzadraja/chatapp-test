import { dbConnect } from "@/dbConfig/dbConfig";
import ApiResponse from "@/helpers/ApiResponse";
import auth from "@/helpers/auth";
import Message from "@/models/Message";
import Chat from "@/models/Chat";
import { uploadOnCloudinary } from "@/lib/uploadOnCloudinary";
import mongoose from "mongoose";

export async function POST(req) {

    await dbConnect();

    const authData = await auth(req);
    const userId = req.userId;
    
    if(!authData.isAuthorized || !userId) {
        return new ApiResponse("Unauthorized", null, false, 401);
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const chatname = formData.get('chatname');
    const id = formData.get('id');
    const replyId = formData.get('replyId');
    const replyUsername = formData.get('replyUsername');
    const type = formData.get('type');
    let image = "", voice = "", fileUrl = "", video = "";

    if(!file){
        return new ApiResponse("File not found", null, false, 400);
    }

    if (!type || !['image', 'voice', 'file', 'video'].includes(type)) {
        return new ApiResponse("Invalid type", null, false, 400);
    }

    if(!chatname){
        return new ApiResponse("Chatname is required", null, false, 400);
    }
    
    if(!id){
        return new ApiResponse("Message Id is missing", null, false, 400);
    }

    if(type == "image"){
        image = await uploadOnCloudinary(file, type);
    } else if(type == "video"){
        video = await uploadOnCloudinary(file, type);
    } else if(type == "voice"){
        voice = await uploadOnCloudinary(file, type);
    } else if(type == "file"){
        fileUrl = await uploadOnCloudinary(file, type);
    }
    

    if(!image && !voice && !fileUrl && !video) {
        return new ApiResponse("Error uploading file", null, false, 500);
    }

    const chat = await Chat.findOne({chatname});

    if(type == "voice"){
        const message = new Message({
            id,
            replyTo: replyId,
            replyUsername,
            voice,
            sendTo: chat._id,
            sendBy: new mongoose.Types.ObjectId(userId)
        });
        await message.save();
    } else if(type == "video"){
        const message = new Message({
            id,
            replyTo: replyId,
            replyUsername,
            video: {videoUrl: video, videoName: file.name},
            sendTo: chat._id,
            sendBy: new mongoose.Types.ObjectId(userId)
        });
        await message.save();
    } else if(type == "file"){
        const message = new Message({
            id,
            replyTo: replyId,
            replyUsername,
            file: {fileUrl, fileName: file.name},
            sendTo: chat._id,
            sendBy: new mongoose.Types.ObjectId(userId)
        });
        await message.save();
    } else if(type == "image"){
        const message = new Message({
            id,
            replyTo: replyId,
            replyUsername,
            image: {imageUrl: image, imageName: file.name},
            sendTo: chat._id,
            sendBy: new mongoose.Types.ObjectId(userId)
        });
        await message.save();
    }

    let uploadedUrl = image || voice || fileUrl || video;

    const response = new ApiResponse("File sent successfully", {fileUrl: uploadedUrl, fileName: file.name}, true, 200);
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