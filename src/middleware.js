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
        const response = await fetch(`${req.nextUrl.origin}/api/users/tokenRefresh`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${refreshToken}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            console.error('Token refresh failed:', response.status, response.statusText);
            return NextResponse.redirect(new URL('/login', req.url));
        }

        const data = await response.json();

        if (!data.success || !data.accessToken || !data.refreshToken) {
            return NextResponse.redirect(new URL('/login', req.url));
        }

        const nextResponse = NextResponse.next();

        nextResponse.cookies.set('accessToken', data.accessToken, {
            httpOnly: true,
            secure: true, // Always set to true for Vercel
            path: '/',
            sameSite: 'lax', // Changed from strict to lax for better compatibility
            maxAge: 3 * 24 * 60 * 60, // 3 days in seconds
        });

        nextResponse.cookies.set('refreshToken', data.refreshToken, {
            httpOnly: true,
            secure: true, // Always set to true for Vercel
            path: '/',
            sameSite: 'lax', // Changed from strict to lax for better compatibility
            maxAge: 365 * 24 * 60 * 60, // 1 year in seconds
        });

        return nextResponse;

    } catch (error) {
        console.error('Error refreshing token:', error.message);
        return NextResponse.redirect(new URL('/login', req.url));
    }
}

export const config = {
    matcher: [
        '/chat/:path*',
        '/join/:path*',
        '/',
        '/profile',
        '/edit-profile',
        '/create-room',
        // Add any other protected routes here
    ]
};
