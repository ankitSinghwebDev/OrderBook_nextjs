// GET /api/users     - Purpose: list users (password fields omitted), newest first
// POST /api/users    - Purpose: create user (no password here), enforce unique email
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

const ALLOWED_ROLES = ['admin', 'manager', 'member', 'viewer', 'vendor', 'user'];

export async function GET() {
  try {
    await connectDB();
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    return NextResponse.json({ users });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json({ message: 'Failed to load users' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      name,
      email,
      role = 'viewer',
      phoneNumber,
      companyName,
      isIndiaB2B,
      gstNumber,
      companyAddress,
    } = body || {};
    const normalizedName = String(name || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedRole = String(role || 'viewer').trim().toLowerCase();
    const indiaBasedB2B = isIndiaB2B === true || isIndiaB2B === 'true';

    if (!normalizedName || !normalizedEmail) {
      return NextResponse.json(
        { message: 'name and email are required' },
        { status: 400 }
      );
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return NextResponse.json({ message: 'Email already exists' }, { status: 409 });
    }

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      role: ALLOWED_ROLES.includes(normalizedRole) ? normalizedRole : 'viewer',
      phoneNumber: String(phoneNumber || '').trim(),
      companyName: String(companyName || '').trim(),
      isIndiaB2B: indiaBasedB2B,
      gstNumber: indiaBasedB2B ? String(gstNumber || '').trim().toUpperCase() : '',
      companyAddress: String(companyAddress || '').trim(),
    });
    const { passwordHash, ...safeUser } = user.toObject();

    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (error) {
    // Handle duplicate key race-condition (unique index)
    if (error?.code === 11000) {
      return NextResponse.json({ message: 'Email already exists' }, { status: 409 });
    }
    console.error('POST /api/users error:', error);
    return NextResponse.json({ message: 'Failed to create user' }, { status: 500 });
  }
}
