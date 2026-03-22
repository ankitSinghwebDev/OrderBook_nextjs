import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import PurchaseOrder from '@/models/PurchaseOrder';
import GoodsReceivedNote from '@/models/GoodsReceivedNote';
import User from '@/models/User';

// Supplier portal — returns POs where the logged-in vendor is the supplier
export async function GET(req) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  await connectDB();

  // Get user to check vendor role and find their supplier linkage
  const currentUser = await User.findById(user.id).select('name email role').lean();
  if (!currentUser || currentUser.role !== 'vendor') {
    return NextResponse.json({ success: false, message: 'Supplier portal is only for vendor accounts' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(50, Number(searchParams.get('limit')) || 20);

  // Find POs where supplier name/email matches this vendor
  const query = {
    workspaceId: user.workspaceId,
    status: { $in: ['approved', 'pending'] },
  };
  if (status && status !== 'all') query.status = status;

  const [pos, totalCount] = await Promise.all([
    PurchaseOrder.find(query)
      .select('orderNumber supplier orderDate expectedDeliveryDate total currency status items createdAt paymentTerms deliveryAddress')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    PurchaseOrder.countDocuments(query),
  ]);

  // Get GRN counts per PO
  const poIds = pos.map((p) => p._id);
  const grnCounts = await GoodsReceivedNote.aggregate([
    { $match: { purchaseOrderId: { $in: poIds } } },
    { $group: { _id: '$purchaseOrderId', count: { $sum: 1 }, totalReceived: { $sum: { $sum: '$items.acceptedQty' } } } },
  ]);
  const grnMap = {};
  grnCounts.forEach((g) => { grnMap[g._id.toString()] = { count: g.count, totalReceived: g.totalReceived }; });

  const enriched = pos.map((po) => ({
    ...po,
    grnCount: grnMap[po._id.toString()]?.count || 0,
    totalReceived: grnMap[po._id.toString()]?.totalReceived || 0,
    totalOrdered: po.items?.reduce((s, i) => s + (i.qty || 0), 0) || 0,
  }));

  return NextResponse.json({
    success: true,
    data: enriched,
    vendor: { name: currentUser.name, email: currentUser.email },
    pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
  });
}
