import { NextResponse } from 'next/server';

export async function middleware(req) {
    const refreshToken = req.cookies.get("refreshToken")?.value;
    const userId = req.cookies.get("userId")?.value;

    if(userId){
        return NextResponse.redirect(new URL('/verify', req.url));
    }

    if (!refreshToken) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/chat/:path*',
        '/join/:path*',
        '/',
        '/profile',
        '/edit-profile',
        '/create-room',
    ]
};
