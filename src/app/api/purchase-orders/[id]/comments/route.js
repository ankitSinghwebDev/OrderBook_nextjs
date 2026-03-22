import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import Comment from '@/models/Comment';
import User from '@/models/User';
import { createNotification } from '@/lib/notifications';
import PurchaseOrder from '@/models/PurchaseOrder';

export async function GET(req, { params }) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const comments = await Comment.find({ entityType: 'PurchaseOrder', entityId: id, workspaceId: user.workspaceId })
    .sort({ createdAt: 1 }).lean();
  return NextResponse.json({ success: true, data: comments });
}

export async function POST(req, { params }) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const { message: msg } = await req.json();

  if (!msg?.trim()) {
    return NextResponse.json({ success: false, message: 'Comment cannot be empty' }, { status: 400 });
  }

  let userName = '', userRole = '';
  try {
    const u = await User.findById(user.id).select('name role').lean();
    userName = u?.name || '';
    userRole = u?.role || '';
  } catch {}

  const comment = await Comment.create({
    entityType: 'PurchaseOrder',
    entityId: id,
    message: msg.trim(),
    userId: user.id,
    userName,
    userRole,
    workspaceId: user.workspaceId,
  });

  // Notify PO creator and approver
  try {
    const po = await PurchaseOrder.findById(id).select('orderNumber createdByUserId approverUserId').lean();
    if (po) {
      const notifyIds = [po.createdByUserId?.toString(), po.approverUserId?.toString()].filter((uid) => uid && uid !== user.id);
      const unique = [...new Set(notifyIds)];
      for (const uid of unique) {
        createNotification({
          userId: uid, type: 'po_comment', title: `New comment on ${po.orderNumber}`,
          message: `${userName}: ${msg.trim().slice(0, 100)}`,
          link: `/purchase-orders/${id}`, entityType: 'PurchaseOrder', entityId: id, workspaceId: user.workspaceId,
        });
      }
    }
  } catch {}

  return NextResponse.json({ success: true, data: comment }, { status: 201 });
}
