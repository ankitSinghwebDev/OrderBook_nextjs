import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import Notification from '@/models/Notification';

export async function GET(req) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const limit = Math.min(50, Number(searchParams.get('limit')) || 20);
  const unreadOnly = searchParams.get('unreadOnly') === 'true';

  const query = { userId: user.id, workspaceId: user.workspaceId };
  if (unreadOnly) query.isRead = false;

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).limit(limit).lean(),
    Notification.countDocuments({ userId: user.id, workspaceId: user.workspaceId, isRead: false }),
  ]);

  return NextResponse.json({ success: true, data: notifications, unreadCount });
}

export async function PATCH(req) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  await connectDB();
  const { ids, markAll } = await req.json();

  if (markAll) {
    await Notification.updateMany(
      { userId: user.id, workspaceId: user.workspaceId, isRead: false },
      { $set: { isRead: true } }
    );
  } else if (ids?.length) {
    await Notification.updateMany(
      { _id: { $in: ids }, userId: user.id },
      { $set: { isRead: true } }
    );
  }

  return NextResponse.json({ success: true });
}
