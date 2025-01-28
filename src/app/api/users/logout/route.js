import { dbConnect } from "@/dbConfig/dbConfig";
import ApiResponse from "@/helpers/ApiResponse";
import User from "@/models/User";
import auth from "@/helpers/auth";

export async function GET(req){
    
    const isAuthenticated = await auth(req);
    const userId = req.userId;
    if(!isAuthenticated || !userId) {
        return new ApiResponse("Unauthorized", null, false, 401);
    }
    
    await dbConnect();
    
    const user = await User.findByIdAndUpdate(userId, {$unset: {refreshToken: 1}})

    const response = new ApiResponse("Logout successful", null, true, 200);

    response.cookies.set('accessToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'strict',
        expires: new Date(0),
    });

    response.cookies.set('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'strict',
        expires: new Date(0),
    });

    return response;
}