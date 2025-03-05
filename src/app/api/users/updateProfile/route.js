import { dbConnect } from "@/dbConfig/dbConfig";
import ApiResponse from "@/helpers/ApiResponse";
import User from "@/models/User";
import mongoose from "mongoose";
import auth from "@/helpers/auth";
import { uploadOnCloudinary } from "@/lib/uploadOnCloudinary";
import { sendEmail } from "@/lib/resend";

export async function POST(req){
    
    const isAuthenticated = await auth(req);
    const userId = req.userId;
    
    if(!isAuthenticated || !userId){
        return new ApiResponse("Unauthorized", null, false, 401);
    }
    
    await dbConnect();

    const formData = await req.formData();
    const username = formData.get('username');
    const password = formData.get('password');
    const profilePicture = formData.get('profilePicture');

    const user = await User.findOne({_id: new mongoose.Types.ObjectId(userId)});

    let isPasswordChanged = false;

    if(!user){
        return new ApiResponse("User not found", null, false, 400)
    }
    
    if(!username && !password && !profilePicture){
        return new ApiResponse("Atleast one field is required", null, false, 400)
    }

    if(username){
        const userWithSameName = await User.findOne({username});
        if(userWithSameName){
            return new ApiResponse("Username already exists", null, false, 400);
        }
        user.username = username;
    }
    if(password){
        const verifyCode = Math.floor(100000 + Math.random() * 900000);
        await sendEmail(user.email, verifyCode);

        user.isVerified = false;
        user.password = password;
        user.verifyCode = verifyCode.toString();
        user.verifyCodeExpiry = Date.now() + 10 * 60 * 1000;

        isPasswordChanged = true;
    }
    if(profilePicture.size){
        let url = await uploadOnCloudinary(profilePicture, 'image');
        user.profilePicture = url;
    }

    await user.save();

    if(isPasswordChanged){
        const response = new ApiResponse("Profile updated successfully", {...user.toObject(), isPasswordChanged}, true, 200);
        response.cookies.set('accessToken', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'strict',
            maxAge: 0,
        });
        
        response.cookies.set('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'strict',
        maxAge: 0,
        });

        response.cookies.set('userId', user._id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'strict',
            maxAge: 600
        });

        return response;

    } else{
        return new ApiResponse("Profile updated successfully", {...user.toObject(), isPasswordChanged}, true, 200);
    }
}