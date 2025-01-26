import { dbConnect } from "@/dbConfig/dbConfig";
import User from "@/models/User";
import ApiResponse from "@/helpers/ApiResponse";

export async function POST(req) {
    await dbConnect();

    const {verifyCode} = await req.json();
    const userId = await req.cookies.get('userId')?.value;

    if(!verifyCode){
        return new ApiResponse("Verify code is required", null, false, 400);
    }

    const user = await User.findOne({_id: userId});
    if(!user){
        return new ApiResponse("User not found", null, false, 404);
    }

    if(user.isVerified){
        return new ApiResponse("User is already verified", null, false, 400);
    }

    if(user.verifyCodeExpiry < Date.now()){
        await user.renewVerifyCode();
        return new ApiResponse("Verify code expired", null, false, 400);
    }

    const isVerifyCodeCorrect = await user.isVerifyCodeCorrect(verifyCode);
    if(!isVerifyCodeCorrect){
        await user.renewVerifyCode();
        return new ApiResponse("Verify code is incorrect", null, false, 400);
    }
    
    user.isVerified = true;
    await user.save();
    return new ApiResponse("User verified successfully", null, true, 200);
}