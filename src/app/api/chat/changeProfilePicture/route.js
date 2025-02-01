import Chat from "@/models/Chat";
import ApiResponse from "@/helpers/ApiResponse";
import { dbConnect } from "@/dbConfig/dbConfig";
import auth from "@/helpers/auth";
import { uploadOnCloudinary } from "@/lib/uploadOnCloudinary";

export async function POST(req) {

    const isAuthenticated = await auth(req);
    const userId = req.userId;
    if(!isAuthenticated || !userId) {
        return new ApiResponse("Unauthorized", null, false, 401);
    }

    await dbConnect();
    const formData = await req.formData();
    const chatname = formData.get('chatname');
    const profilePicture = formData.get('profilePicture');

    if(!chatname) {
        return new ApiResponse("Chatname is required", null, false, 400);
    }

    if(!profilePicture) {
        return new ApiResponse("Profile Picture is required", null, false, 400);
    }

    const chat = await Chat.findOne({chatname});

    if(!chat) {
        return new ApiResponse("Chat not found", null, false, 400);
    }

    if(chat.owner.toString() !== userId) {
        return new ApiResponse("Unauthorized", null, false, 401);
    }

    const url = await uploadOnCloudinary(profilePicture);

    if(!url) {
        return new ApiResponse("Error uploading image", null, false, 500);
    }

    chat.profilePicture = url;
    await chat.save({validateBeforeSave: false});

    return new ApiResponse("Profile Picture updated successfully", url, true, 200);
}