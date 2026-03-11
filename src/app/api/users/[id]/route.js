// GET /api/users/[id]
// Purpose: fetch a single user by id (omits password/reset fields)
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

const FALLBACK_SECRET = 'insecure_dev_secret_change_me';
const JWT_SECRET = process.env.JWT_SECRET || FALLBACK_SECRET;

export async function GET(_req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const user = await User.findById(id).select('-passwordHash -resetToken -resetExpires');
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error('GET /api/users/[id] error:', error);
    return NextResponse.json({ message: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    let decoded = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
    if (decoded.sub !== id && decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const avatarUrl = String(body?.avatarUrl || '').trim();
    if (!avatarUrl) {
      return NextResponse.json({ message: 'avatarUrl is required' }, { status: 400 });
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { avatarUrl },
      { new: true }
    ).select('-passwordHash -resetToken -resetExpires');

    if (!updated) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: updated }, { status: 200 });
  } catch (error) {
    console.error('PATCH /api/users/[id] error:', error);
    return NextResponse.json({ message: 'Failed to update user' }, { status: 500 });
  }
}
