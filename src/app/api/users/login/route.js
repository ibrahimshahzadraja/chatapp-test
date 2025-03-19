import { dbConnect } from "@/dbConfig/dbConfig";
import User from "@/models/User";
import ApiResponse from "@/helpers/ApiResponse";
import { generateAccessAndRefreshToken } from "@/utils/generateTokens";

export async function POST(req) {
    await dbConnect();

    const {email, password} = await req.json();

    if(!email || !password){
        return new ApiResponse("Email and password are required", null, false, 400);
    }

    const user = await User.findOne({email});
    if(!user){
        return new ApiResponse("User not found", null, false, 404);
    }
    if(!user.isVerified){
        return new ApiResponse("User is not verified", {isVerified: false}, false, 400);
    }

    const userWithSameUsername = await User.findOne({username: user.username, email: {$ne: email}});
    if(userWithSameUsername?.isVerified){
        return new ApiResponse("User with same username already exists", null, false, 400);
    }


    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if(!isPasswordCorrect){
        return new ApiResponse("Password is incorrect", null, false, 400);
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

    if(!accessToken || !refreshToken){
        return new ApiResponse("Error while generating access and refresh token", null, false, 400);
    }

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const response = new ApiResponse("Login successful", loggedInUser, true, 200);
    response.cookies.set('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'strict',
        maxAge: 3 * 24 * 60 * 60,
    });
    
    response.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'strict',
    maxAge: 365 * 24 * 60 * 60
    });

    return response;
}