// POST /api/workspaces - create a workspace, owner receives a join code
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Workspace from '@/models/Workspace';
import User from '@/models/User';
import WorkspaceMember from '@/models/WorkspaceMember';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

function generateCode(length = 6) {
  // Returns an uppercase base36-ish code without ambiguous chars
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i += 1) {
    const idx = crypto.randomInt(0, chars.length);
    code += chars[idx];
  }
  return code;
}

async function uniqueCode() {
  while (true) {
    const code = generateCode(6);
    const exists = await Workspace.exists({ joinCode: code });
    if (!exists) return code;
  }
}

async function createWorkspaceId() {
  while (true) {
    const candidate = crypto.randomBytes(6).toString('hex'); // 12-char hex id
    const exists = await Workspace.exists({ workspaceId: candidate });
    if (!exists) return candidate;
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, ownerUserId } = body || {};

    if (!name || !ownerUserId) {
      return NextResponse.json(
        { message: 'name and ownerUserId are required' },
        { status: 400 }
      );
    }

    const owner = await User.findById(ownerUserId);
    if (!owner) {
      return NextResponse.json({ message: 'Owner not found' }, { status: 404 });
    }

    const workspaceId = await createWorkspaceId();
    const joinCode = await uniqueCode();

    const workspace = await Workspace.create({
      name: String(name).trim(),
      workspaceId,
      joinCode,
      ownerUserId,
      membersCount: 1,
    });

    owner.workspaceId = workspaceId;
    owner.isCreator = true;
    owner.role = 'admin';
    await owner.save();

    await WorkspaceMember.create({
      workspaceId,
      userId: owner._id,
      role: 'admin',
      isOwner: true,
    });

    const token = jwt.sign(
      {
        sub: owner._id.toString(),
        email: owner.email,
        role: owner.role || 'admin',
        workspaceId,
      },
      process.env.JWT_SECRET || 'insecure_dev_secret_change_me',
      { expiresIn: '7d' }
    );

    const { joinCode: _jc, ...safeWorkspace } = workspace.toObject();
    const res = NextResponse.json({ workspace: safeWorkspace, joinCode, token }, { status: 201 });
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
    console.error('POST /api/workspaces error:', error);
    return NextResponse.json({ message: 'Failed to create workspace' }, { status: 500 });
  }
}
