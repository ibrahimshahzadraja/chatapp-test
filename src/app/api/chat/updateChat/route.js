import { dbConnect } from "@/dbConfig/dbConfig";
import ApiResponse from "@/helpers/ApiResponse";
import User from "@/models/User";
import mongoose from "mongoose";
import auth from "@/helpers/auth";
import { uploadOnCloudinary } from "@/lib/uploadOnCloudinary";
import Chat from "@/models/Chat";

export async function POST(req){
    
    const isAuthenticated = await auth(req);
    const userId = req.userId;
    
    if(!isAuthenticated || !userId){
        return new ApiResponse("Unauthorized", null, false, 401);
    }
    
    await dbConnect();

    const formData = await req.formData();
    const convoname = formData.get('convoname');
    const password = formData.get('password');
    const profilePicture = formData.get('profilePicture');
    const chatname = formData.get('chatname');

    let isChatnameChanged = false;
    let isProfilePictureChanged = false;

    const user = await User.findOne({_id: new mongoose.Types.ObjectId(userId)});

    if(!user){
        return new ApiResponse("User not found", null, false, 400)
    }
    
    const chat = await Chat.findOne({chatname});
    
    if(!chat){
        return new ApiResponse("Chat not found", null, false, 400)
    }
    
    if(!(chat.owner == userId || chat.admins.includes(new mongoose.Types.ObjectId(userId)))){
        return new ApiResponse("Access denied", {isAuthorized: false}, false, 400)
    }
    
    if(!convoname && !password && !profilePicture){
        return new ApiResponse("Atleast one field is required", null, false, 400)
    }

    if(convoname){
        const chatWithSameName = await Chat.findOne({chatname: convoname});
        if(chatWithSameName){
            return new ApiResponse("Chat with this name already exists", null, false, 400)
        }
        chat.chatname = convoname;
        isChatnameChanged = true;
    }
    if(password){
        chat.password = password;
    }
    if(profilePicture.size){
        let url = await uploadOnCloudinary(profilePicture, 'image');
        chat.profilePicture = url;
        isProfilePictureChanged = true;
    }

    await chat.save();

    return new ApiResponse("Chat updated successfully", {chatname: chat.chatname, profilePicture: chat.profilePicture, user: user.username, isProfilePictureChanged, isChatnameChanged}, true, 200);
}