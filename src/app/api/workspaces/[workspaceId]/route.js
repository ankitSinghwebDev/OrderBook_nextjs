// PATCH /api/workspaces/[workspaceId] - regenerate join code (owner only)
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Workspace from '@/models/Workspace';
import User from '@/models/User';
import crypto from 'crypto';

function generateCode(length = 6) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += chars[crypto.randomInt(0, chars.length)];
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

export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { workspaceId } = params;
    const body = await req.json();
    const { requesterUserId } = body || {};

    if (!requesterUserId) {
      return NextResponse.json({ message: 'requesterUserId is required' }, { status: 400 });
    }

    const workspace = await Workspace.findOne({ workspaceId });
    if (!workspace) {
      return NextResponse.json({ message: 'Workspace not found' }, { status: 404 });
    }

    const requester = await User.findById(requesterUserId);
    if (!requester || requester.workspaceId !== workspaceId || !requester.isCreator) {
      return NextResponse.json({ message: 'Only the workspace owner can regenerate the join code' }, { status: 403 });
    }

    const newCode = await uniqueJoinCode();
    workspace.joinCode = newCode;
    await workspace.save();

    const { joinCode: _jc, ...safeWorkspace } = workspace.toObject();
    return NextResponse.json({ workspace: safeWorkspace, joinCode: newCode }, { status: 200 });
  } catch (error) {
    console.error('PATCH /api/workspaces/[workspaceId] error:', error);
    return NextResponse.json({ message: 'Failed to regenerate join code' }, { status: 500 });
  }
}
