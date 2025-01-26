import ApiResponse from "@/helpers/ApiResponse";
import { dbConnect } from "@/dbConfig/dbConfig";
import Chat from "@/models/Chat";

export async function POST(req) {
    await dbConnect();

    const { chatname } = await req.json();

    if(!chatname){
        return new ApiResponse("Chatname is required", null, false, 400);
    }

    const chat = await Chat.findOne({chatname});
    
    if(!chat){
        return new ApiResponse("Chat not found", null, false, 400);
    }

    const requestHeaders = new Headers(req.headers);
    const userId = requestHeaders.get('x-user-id');

    if(!chat.members.includes(userId)){
        return new ApiResponse("You are not the member of this room", null, false, 400);
    }

    await Chat.updateOne(
        { chatname },
        { $pull: { members: userId } }
    );

    return new ApiResponse("Room left successfully", null, true, 200);
      
}