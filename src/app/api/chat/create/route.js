import Chat from "@/models/Chat";
import ApiResponse from "@/helpers/ApiResponse";
import { dbConnect } from "@/dbConfig/dbConfig";
import auth from "@/helpers/auth";

export async function POST(req) {
    
    const isAuthenticated = await auth(req);
    const userId = req.userId;
    if(!isAuthenticated || !userId) {
        return new ApiResponse("Unauthorized", null, false, 401);
    }

    await dbConnect();
    const {chatname, password} = await req.json();

    if(!chatname || !password) {
        return new ApiResponse("Chatname and password are required", null, false, 400);
    }

    const chat = await Chat.findOne({chatname});

    if(chat) {
        return new ApiResponse("Chatname already exists", null, false, 400);
    }

    const newChat = new Chat({
        owner: userId,
        chatname,
        password
    });

    await newChat.save();

    return new ApiResponse("Chat created successfully", chatname, true, 201);
}
