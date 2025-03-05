import ApiResponse from "@/helpers/ApiResponse";
import { dbConnect } from "@/dbConfig/dbConfig";
import Chat from "@/models/Chat";
import auth from "@/helpers/auth";
import User from "@/models/User";

export async function POST(req) {

    const isAuthenticated = await auth(req);
    const userId = req.userId;
    if(!isAuthenticated || !userId) {
        return new ApiResponse("Unauthorized", null, false, 401);
    }

    await dbConnect();

    const { chatname, username } = await req.json();

    const userAdmin = await User.findById({userId});

    if(!chatname){
        return new ApiResponse("Chatname is required", null, false, 400);
    }
    if(!username){
        return new ApiResponse("Username is required", null, false, 400);
    }

    const user = await User.findOne({ username });

    if (!user) {
        return new ApiResponse("User not found", null, false, 400);
    }

    const chat = await Chat.findOne({ chatname });

    if(!(chat.owner == userId || chat.admins.includes(new mongoose.Types.ObjectId(userId)))){
        return new ApiResponse("Access denied", null, false, 400);
    }

    if (!chat) {
        return new ApiResponse("Chat not found", null, false, 400);
    }

    const isBanned = chat.banned.includes(user._id);

    if (isBanned) {
        chat.banned.pull(user._id);
        await chat.save();
        return new ApiResponse("User unbanned successfully", {user: userAdmin.username}, true, 200);
    } else {
        chat.banned.push(user._id);
        await chat.save();
        return new ApiResponse("User banned successfully", {user: userAdmin.username}, true, 200);
    }
}
