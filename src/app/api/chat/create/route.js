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
    const password = formData.get('password');
    const profilePicture = formData.get('profilePicture');

    if(!chatname || !password) {
        return new ApiResponse("Chatname and password are required", null, false, 400);
    }

    const chat = await Chat.findOne({chatname});

    if(chat) {
        return new ApiResponse("Chatname already exists", null, false, 400);
    }

    let url = "/images/default-icon.jpeg";
    if(profilePicture.size){
        url = await uploadOnCloudinary(profilePicture, 'image');

        if(!url) {
            return new ApiResponse("Error uploading image", null, false, 500);
        }
    }

    const newChat = new Chat({
        owner: userId,
        chatname,
        password,
        profilePicture: url,
    });

    await newChat.save();

    return new ApiResponse("Chat created successfully", chatname, true, 201);
}
