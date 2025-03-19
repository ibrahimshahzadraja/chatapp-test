import User from "@/models/User";
import { generateAccessAndRefreshToken } from "@/utils/generateTokens";
import jwt from "jsonwebtoken";
import { dbConnect } from "@/dbConfig/dbConfig";
import { NextResponse } from 'next/server';

export async function GET(req) {
    await dbConnect();

    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
        return NextResponse.json({ message: "Refresh token is required", success: false }, { status: 400 });
    }

    try {
        const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);
        
        if (!user) {
            return NextResponse.json({ message: "User not found", success: false }, { status: 404 });
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

        const response = NextResponse.json({
            message: "Token refreshed successfully",
            success: true,
            accessToken: accessToken,
            refreshToken: refreshToken
        }, { status: 200 });
        
        response.cookies.set('accessToken', accessToken, {
            httpOnly: true,
            secure: true,
            path: '/',
            sameSite: 'lax',
            maxAge: 3 * 24 * 60 * 60, // 3 days
        });
        
        response.cookies.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            path: '/',
            sameSite: 'lax',
            maxAge: 365 * 24 * 60 * 60, // 7 days
        });
        
        return response;
        

    } catch (error) {
        console.error("Token verification failed", error);
        return NextResponse.json({ message: "Invalid refresh token", success: false }, { status: 401 });
    }
}
