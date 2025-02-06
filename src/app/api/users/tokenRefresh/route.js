import User from "@/models/User";
import { generateAccessAndRefreshToken } from "@/utils/generateTokens";
import ApiResponse from "@/helpers/ApiResponse";
import jwt from "jsonwebtoken";
import { dbConnect } from "@/dbConfig/dbConfig";

export async function GET(req){
    await dbConnect();
    const token = await req.cookies.get('refreshToken')?.value;

    if(!token){
        return new ApiResponse("Refresh token is required", null, false, 400);
    }

    const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id);

    if(!user){
        return new ApiResponse("User not found", null, false, 404);
    }
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const response = new ApiResponse("Token refreshed successfully", user.username, true, 200);
    response.cookies.set('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'strict',
        maxAge: 3 * 24 * 60 * 60 * 1000
    });
    
    response.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'strict',
    maxAge: 365 * 24 * 60 * 60 * 1000
    });

    return response;
}