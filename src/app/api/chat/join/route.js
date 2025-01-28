import ApiResponse from "@/helpers/ApiResponse";
import { dbConnect } from "@/dbConfig/dbConfig";
import Chat from "@/models/Chat";
import auth from "@/helpers/auth";

export async function POST(req) {

    const isAuthenticated = await auth(req);
    const userId = req.userId;
    if(!isAuthenticated || !userId) {
        return new ApiResponse("Unauthorized", null, false, 401);
    }

    await dbConnect();

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

    chat.members.push(userId);
    await chat.save();

    return new ApiResponse("Succefully joined the room", null, true, 200);

}