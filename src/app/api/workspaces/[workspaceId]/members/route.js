// GET /api/workspaces/[workspaceId]/members - list users in a workspace
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import WorkspaceMember from '@/models/WorkspaceMember';
import User from '@/models/User';

export async function GET(_req, { params }) {
  try {
    await connectDB();
    const { workspaceId } = params;
    if (!workspaceId) {
      return NextResponse.json({ message: 'workspaceId is required' }, { status: 400 });
    }

    const memberships = await WorkspaceMember.find({ workspaceId }).lean();
    const userIds = memberships.map((m) => m.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('name email role workspaceId isCreator avatarUrl')
      .lean();

    const usersById = new Map(users.map((u) => [u._id.toString(), u]));

    const members = memberships.map((m) => {
      const user = usersById.get(m.userId.toString()) || {};
      return {
        userId: m.userId,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: m.role || user.role,
        isOwner: !!m.isOwner,
        joinedAt: m.joinedAt,
      };
    });

    return NextResponse.json({ members }, { status: 200 });
  } catch (error) {
    console.error('GET /api/workspaces/[workspaceId]/members error:', error);
    return NextResponse.json({ message: 'Failed to load members' }, { status: 500 });
  }
}
