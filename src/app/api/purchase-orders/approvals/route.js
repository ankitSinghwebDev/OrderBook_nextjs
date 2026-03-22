import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import PurchaseOrder from '@/models/PurchaseOrder';

export async function GET(req) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'pending';

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
  const skip = (page - 1) * limit;

  const query = {
    approverUserId: user.id,
    workspaceId: user.workspaceId,
  };
  if (status !== 'all') query.status = status;

  const [orders, totalCount] = await Promise.all([
    PurchaseOrder.find(query)
      .select('orderNumber supplier total currency status createdAt createdByName expectedDeliveryDate items')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    PurchaseOrder.countDocuments(query),
  ]);

  return NextResponse.json({
    success: true,
    data: orders,
    pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
  });
}
