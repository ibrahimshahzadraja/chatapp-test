import ApiResponse from "@/helpers/ApiResponse";
import { dbConnect } from "@/dbConfig/dbConfig";
import Chat from "@/models/Chat";
import auth from "@/helpers/auth";
import User from "@/models/User";

export async function POST(req) {

    await dbConnect();

    const authData = await auth(req);
    const userId = req.userId;
    
    if(!authData.isAuthorized || !userId) {
        return new ApiResponse("Unauthorized", null, false, 401);
    }

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
        const response = new ApiResponse("User unbanned successfully", {user: userAdmin.username}, true, 200);

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
            sameSite: 'strict',
            maxAge: 365 * 24 * 60 * 60
            });
        }

        return response;
    } else {
        chat.banned.push(user._id);
        await chat.save();
        const response = new ApiResponse("User banned successfully", {user: userAdmin.username}, true, 200);

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
            sameSite: 'strict',
            maxAge: 365 * 24 * 60 * 60
            });
        }

        return response;
    }
}
