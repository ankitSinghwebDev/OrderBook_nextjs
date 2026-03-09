// GET /api/purchase-orders/approvals?userId=... - list POs assigned to an approver
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import PurchaseOrder from '@/models/PurchaseOrder';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') || 'pending';
    if (!userId) {
      return NextResponse.json({ message: 'userId is required' }, { status: 400 });
    }

    const orders = await PurchaseOrder.find({
      approverUserId: userId,
      status,
    })
      .select('orderNumber supplier total currency status createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error('GET /api/purchase-orders/approvals error:', error);
    return NextResponse.json({ message: 'Failed to load approvals' }, { status: 500 });
  }
}
