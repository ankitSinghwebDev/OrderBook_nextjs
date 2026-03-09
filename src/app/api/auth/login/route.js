// POST /api/auth/login
// Purpose: authenticate user credentials, issue JWT, and set httpOnly auth cookie
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

const FALLBACK_SECRET = 'insecure_dev_secret_change_me';
const JWT_SECRET = process.env.JWT_SECRET || FALLBACK_SECRET;

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET is required in production');
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { email, password } = body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return NextResponse.json(
        { message: 'email and password are required' },
        { status: 400 }
      );
    }

    // Case-insensitive lookup to support legacy records that weren't normalized
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}$`, 'i') },
    });
    if (!user || !user.passwordHash) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        role: user.role || 'user',
        workspaceId: user.workspaceId || null,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash, ...safeUser } = user.toObject();

    const res = NextResponse.json({ user: safeUser, token }, { status: 200 });
    res.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return res;
  } catch (error) {
    console.error('POST /api/auth/login error:', error);
    return NextResponse.json(
      { message: 'Failed to login' },
      { status: 500 }
    );
  }
}
