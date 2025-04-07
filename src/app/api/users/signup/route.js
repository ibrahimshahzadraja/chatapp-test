import { dbConnect } from "@/dbConfig/dbConfig";
import { uploadOnCloudinary } from "@/lib/uploadOnCloudinary";
import User from "@/models/User";
import ApiResponse from "@/helpers/ApiResponse";
import { sendEmail } from "@/lib/resend";


export async function POST(req) {
    await dbConnect();

    const formData = await req.formData();
    const username = formData.get('username');
    const email = formData.get('email');
    const password = formData.get('password');
    const profilePicture = formData.get('profilePicture');

    if(!username || !email || !password || !profilePicture) {
        return new ApiResponse("All fields are required", null, false, 400);
    }

    const userExists = await User.findOne({username});

    if(!userExists?.isVerfied){
        await User.deleteOne({_id: userExists._id});
    }

    if(userExists){
        return new ApiResponse("Username already exists", null, false, 400);
    }

    const emailExists = await User.findOne({email});
    if(emailExists) {
        return new ApiResponse("Email already exists", null, false, 400);
    }

    const url = await uploadOnCloudinary(profilePicture);

    if(!url) {
        return new ApiResponse("Error uploading image", null, false, 500);
    }

    const verifyCode = Math.floor(100000 + Math.random() * 900000);

    await sendEmail(email, verifyCode);

    const newUser = new User({
        username,
        email,
        password,
        profilePicture: url,
        verifyCode: verifyCode.toString(),
    });

    await newUser.save();

    const response = new ApiResponse("User created successfully", null, true, 201);
    response.cookies.set('userId', newUser._id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'strict',
        maxAge: 600
    });

    return response;
}
