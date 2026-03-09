// GET /api/users/[id]
// Purpose: fetch a single user by id (omits password/reset fields)
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

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
