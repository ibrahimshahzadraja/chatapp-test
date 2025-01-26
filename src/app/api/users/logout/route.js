import { dbConnect } from "@/dbConfig/dbConfig";
import ApiResponse from "@/helpers/ApiResponse";
import User from "@/models/User";

export async function GET(req){
    await dbConnect();

    const requestHeaders = new Headers(req.headers);
    const userId = requestHeaders.get('x-user-id');

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