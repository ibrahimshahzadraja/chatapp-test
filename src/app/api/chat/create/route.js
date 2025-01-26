import Chat from "@/models/Chat";
import ApiResponse from "@/helpers/ApiResponse";
import { dbConnect } from "@/dbConfig/dbConfig";

export async function POST(req) {
    await dbConnect();
    const {chatname, password} = await req.json();

    const requestHeaders = new Headers(req.headers);
    const userId = requestHeaders.get('x-user-id');

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
