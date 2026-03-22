import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import GoodsReceivedNote from '@/models/GoodsReceivedNote';

export async function GET(req, { params }) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const grn = await GoodsReceivedNote.findOne({ _id: id, workspaceId: user.workspaceId }).lean();
  if (!grn) return NextResponse.json({ success: false, message: 'GRN not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: grn });
}
