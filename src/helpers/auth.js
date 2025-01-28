import jwt from "jsonwebtoken";
import { cookies } from 'next/headers';

async function getUser(req) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken').value;

  if (!accessToken) {
    console.log("No access token found.");
    return false;
  }

  try {
    const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    console.log("Decoded token:", decodedToken);
    req.userId = decodedToken?._id;
    console.log('Added userId:', req.userId);
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