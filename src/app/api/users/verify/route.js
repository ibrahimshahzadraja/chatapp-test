import { dbConnect } from "@/dbConfig/dbConfig";
import User from "@/models/User";
import ApiResponse from "@/helpers/ApiResponse";
import { generateAccessAndRefreshToken } from "@/utils/generateTokens";

export async function POST(req) {
    await dbConnect();

    const {verifyCode} = await req.json();
    const userId = await req.cookies.get('userId')?.value;

    if(!verifyCode){
        return new ApiResponse("Verify code is required", null, false, 400);
    }

    const user = await User.findOne({_id: userId});
    if(!user){
        return new ApiResponse("User not found", {hasUserId: false}, false, 404);
    }

    if(user.isVerified){
        return new ApiResponse("User is already verified", null, false, 400);
    }

    if(user.verifyCodeExpiry < Date.now()){
        await user.renewVerifyCode();
        return new ApiResponse("Verify code expired. New code has been sent to your email.", null, false, 400);
    }

    const isVerifyCodeCorrect = await user.isVerifyCodeCorrect(verifyCode);
    if(!isVerifyCodeCorrect){
        await user.renewVerifyCode();
        return new ApiResponse("Verify code is incorrect. New code has been sent to your email", null, false, 400);
    }
    
    user.isVerified = true;
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
    await user.save();

    const response = new ApiResponse("User verified successfully", null, true, 200);
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
    sameSite: 'lax',
    maxAge: 365 * 24 * 60 * 60
    });
    
    response.cookies.set('userId', "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'strict',
    maxAge: 0
    });

    return response;
}