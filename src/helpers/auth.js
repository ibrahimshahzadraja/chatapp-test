import jwt from "jsonwebtoken";
import { cookies } from 'next/headers';
import { generateAccessAndRefreshToken } from "@/utils/generateTokens";
import User from "@/models/User";

export default async function auth(req) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value;
	
	if(!refreshToken){
		return {accessToken: '', refreshToken: '', isAuthorized: false, tokenChanged: false};
	}

	if(!accessToken){
        const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);
        
        if (!user){
			return {accessToken: '', refreshToken: '', isAuthorized: false, tokenChanged: false};
        }
		
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
		req.userId = decodedToken ?._id;
		
		return {accessToken, refreshToken, isAuthorized: true, tokenChanged: true};
	}

	const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
	req.userId = decodedToken ?._id;

	return {accessToken: '', refreshToken: '', isAuthorized: true, tokenChanged: false};
}