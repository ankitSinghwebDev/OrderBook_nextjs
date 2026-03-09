import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = ['/home', '/login', '/signup', '/forgot-password', '/reset-password', '/api', '/_next', '/favicon.ico'];

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET || 'insecure_dev_secret_change_me')
    );
    return NextResponse.next();
  } catch (err) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: [
    '/workspace/:path*',
    '/create-new-po/:path*',
    '/purchase-orders/:path*',
    '/suppliers/:path*',
    '/addresses/:path*',
    '/approvals/:path*',
    '/bot/:path*',
  ],
};
