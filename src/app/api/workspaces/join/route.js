// POST /api/workspaces/join - join a workspace using a join code
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import Workspace from '@/models/Workspace';
import User from '@/models/User';
import WorkspaceMember from '@/models/WorkspaceMember';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const FALLBACK_SECRET = 'insecure_dev_secret_change_me';
const JWT_SECRET = process.env.JWT_SECRET || FALLBACK_SECRET;

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET is required in production');
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { joinCode, userId, role, name, email, password } = body || {};

    const normalizedCode = String(joinCode || '').trim().toUpperCase();
    if (!normalizedCode || normalizedCode.length < 4) {
      return NextResponse.json({ message: 'joinCode is required' }, { status: 400 });
    }
    if (!userId && !email) {
      return NextResponse.json({ message: 'userId or email is required' }, { status: 400 });
    }
    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: 'Invalid userId' }, { status: 400 });
    }

    const workspace = await Workspace.findOne({ joinCode: normalizedCode });
    if (!workspace) {
      return NextResponse.json({ message: 'Invalid join code' }, { status: 404 });
    }

    let user = null;
    if (userId) {
      user = await User.findById(userId);
    } else if (email) {
      user = await User.findOne({ email: String(email).trim().toLowerCase() });
    }
    if (!user && email) {
      if (!password || String(password).length < 8) {
        return NextResponse.json(
          { message: 'Password must be at least 8 characters to join.' },
          { status: 400 }
        );
      }
      const pwd = await bcrypt.hash(String(password), 10);
      user = await User.create({
        name: String(name || 'New Member').trim(),
        email: String(email).trim().toLowerCase(),
        role: 'viewer',
        workspaceId: workspace.workspaceId,
        isCreator: false,
        passwordHash: pwd,
      });
    }
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Allow setting / resetting password during join (for existing users too)
    if (password && String(password).length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters to join.' },
        { status: 400 }
      );
    }
    if (password && String(password).length >= 8) {
      user.passwordHash = await bcrypt.hash(String(password), 10);
    }

    user.workspaceId = workspace.workspaceId;
    user.isCreator = false;
    user.role = ['admin', 'manager', 'viewer'].includes(role) ? role : 'viewer';
    await user.save();

    await Workspace.updateOne(
      { _id: workspace._id },
      { $inc: { membersCount: 1 } }
    );

    await WorkspaceMember.findOneAndUpdate(
      { workspaceId: workspace.workspaceId, userId: user._id },
      {
        workspaceId: workspace.workspaceId,
        userId: user._id,
        role: user.role,
        isOwner: false,
        joinedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    const { joinCode: _jc, ...safeWorkspace } = workspace.toObject();
    const { passwordHash, ...safeUser } = user.toObject();

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        role: user.role || 'viewer',
        workspaceId: workspace.workspaceId,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const res = NextResponse.json({ workspace: safeWorkspace, user: safeUser, token }, { status: 200 });
    res.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    console.error('POST /api/workspaces/join error:', error);
    return NextResponse.json({ message: 'Failed to join workspace' }, { status: 500 });
  }
}
