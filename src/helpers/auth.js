import jwt from "jsonwebtoken";
import { cookies } from 'next/headers';

async function getUser(req) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

	console.log("ACCESSTOKENINAUTH: ", accessToken);

	if (!accessToken) {
		return false;
	}

	try {
		const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
		req.userId = decodedToken?._id;
		return true;
	} catch (error) {
		console.error("Error verifying token");
		return false;
	}
}

export default async function auth(req) {
    const isAuthenticated = await getUser(req);

    return isAuthenticated;
}