import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function middleware(req) {
    const accessToken = req.cookies.get("accessToken")?.value;
    const refreshToken = req.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    if (accessToken) {
        try {
            const decodedToken = jwt.decode(accessToken);

            if (decodedToken && decodedToken.exp * 1000 > Date.now()) {
                return NextResponse.next();
            }
        } catch (error) {
            console.error("Error decoding access token:", error);
        }
    }

    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || req.nextUrl.origin;
        const response = await fetch(`${baseUrl}/api/users/tokenRefresh`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${refreshToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Token refresh failed:', response.status, response.statusText);
            return NextResponse.redirect(new URL('/login', req.url));
        }

        const data = await response.json();

        if (!data.success) {
            return NextResponse.redirect(new URL('/login', req.url));
        }

        const nextResponse = NextResponse.next();

        nextResponse.cookies.set('accessToken', data.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'strict',
            maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
        });

        
        nextResponse.cookies.set('refreshToken', data.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'strict',
            maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        });

        return nextResponse;

    } catch (error) {
        console.error('Error refreshing token:', error.message);
        return NextResponse.redirect(new URL('/login', req.url));
    }
}

export const config = {
    matcher: ['/chat/:path*', '/join/:path*', '/', '/profile', '/edit-profile', '/create-room'],
};
