// POST /api/auth/logout
// Purpose: clear auth cookie and end session client-side
import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ message: 'logged out' });
  res.cookies.set({
    name: 'auth_token',
    value: '',
    path: '/',
    maxAge: 0,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
