// POST /api/auth/register
// Purpose: create a new user account, hash password, prevent duplicate emails
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Workspace from '@/models/Workspace';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import WorkspaceMember from '@/models/WorkspaceMember';

const FALLBACK_SECRET = 'insecure_dev_secret_change_me';
const JWT_SECRET = process.env.JWT_SECRET || FALLBACK_SECRET;

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET is required in production');
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function generateCode(length = 6) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i += 1) {
    const idx = crypto.randomInt(0, chars.length);
    code += chars[idx];
  }
  return code;
}

async function uniqueJoinCode() {
  while (true) {
    const code = generateCode(6);
    const exists = await Workspace.exists({ joinCode: code });
    if (!exists) return code;
  }
}

async function uniqueWorkspaceId() {
  while (true) {
    const candidate = crypto.randomBytes(6).toString('hex'); // 12 chars
    const exists = await Workspace.exists({ workspaceId: candidate });
    if (!exists) return candidate;
  }
}


export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const {
      name,
      fullName,
      email,
      password,
      phoneNumber,
      companyName,
      isIndiaB2B,
      gstNumber,
      companyAddress,
      role = 'viewer',
    } = body || {};

    const normalizedName = String(fullName || name || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedCompanyName = String(companyName || '').trim();
    const normalizedCompanyAddress = String(companyAddress || '').trim();
    const normalizedPhoneNumber = String(phoneNumber || '').trim();
    const normalizedRole = String(role || 'viewer').trim().toLowerCase();
    const normalizedGstNumber = String(gstNumber || '').trim().toUpperCase();
    const indiaBasedB2B = isIndiaB2B === true || isIndiaB2B === 'true';
    const validRoles = new Set(['admin', 'manager', 'viewer']);

    if (!normalizedName || !normalizedEmail || !password) {
      return NextResponse.json(
        { message: 'name, email, and password are required' },
        { status: 400 }
      );
    }

    if (!normalizedCompanyName || !normalizedCompanyAddress) {
      return NextResponse.json(
        { message: 'company name and company address are required' },
        { status: 400 }
      );
    }

    if (!validRoles.has(normalizedRole)) {
      return NextResponse.json(
        { message: 'role must be one of admin, manager, or viewer' },
        { status: 400 }
      );
    }

    if (indiaBasedB2B && !normalizedGstNumber) {
      return NextResponse.json(
        { message: 'GST number is required for India-based B2B companies' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const exists = await User.exists({
      email: { $regex: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i') },
    });
    if (exists) {
      return NextResponse.json(
        { message: 'Email already exists' },
        { status: 409 }
      );
    }

    // Always create workspace on first signup; user becomes creator/admin
    const workspaceId = await uniqueWorkspaceId();
    const joinCode = await uniqueJoinCode();
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      phoneNumber: normalizedPhoneNumber,
      companyName: normalizedCompanyName,
      isIndiaB2B: indiaBasedB2B,
      gstNumber: indiaBasedB2B ? normalizedGstNumber : '',
      companyAddress: normalizedCompanyAddress,
      role: 'admin',
      workspaceId,
      isCreator: true,
      passwordHash,
    });

    const workspace = await Workspace.create({
      name: normalizedCompanyName || normalizedName || 'Workspace',
      workspaceId,
      joinCode,
      ownerUserId: user._id,
      membersCount: 1,
    });

    await WorkspaceMember.create({
      workspaceId,
      userId: user._id,
      role: 'admin',
      isOwner: true,
      joinedAt: new Date(),
    });

    const { passwordHash: _, ...safeUser } = user.toObject();

    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const res = NextResponse.json(
      { user: safeUser, token, workspace: { ...workspace.toObject(), joinCode } },
      { status: 201 }
    );
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
    if (error?.code === 11000) {
      return NextResponse.json({ message: 'Email already exists' }, { status: 409 });
    }
    console.error('POST /api/auth/register error:', error);
    return NextResponse.json(
      { message: 'Failed to create account' },
      { status: 500 }
    );
  }
}
