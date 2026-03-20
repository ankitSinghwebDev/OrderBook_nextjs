import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import PurchaseOrder from '@/models/PurchaseOrder';
import Supplier from '@/models/Supplier';

export async function GET(req) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  await connectDB();
  const workspaceId = user.workspaceId;

  const [
    totalPOs,
    pendingPOs,
    approvedPOs,
    rejectedPOs,
    draftPOs,
    cancelledPOs,
    totalSuppliers,
    recentPOs,
    spendByStatus,
    monthlySpend,
  ] = await Promise.all([
    PurchaseOrder.countDocuments({ workspaceId }),
    PurchaseOrder.countDocuments({ workspaceId, status: 'pending' }),
    PurchaseOrder.countDocuments({ workspaceId, status: 'approved' }),
    PurchaseOrder.countDocuments({ workspaceId, status: 'rejected' }),
    PurchaseOrder.countDocuments({ workspaceId, status: 'draft' }),
    PurchaseOrder.countDocuments({ workspaceId, status: 'cancelled' }),
    Supplier.countDocuments({ workspaceId, status: 'active' }),
    PurchaseOrder.find({ workspaceId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber supplier total currency status createdAt createdByName')
      .lean(),
    PurchaseOrder.aggregate([
      { $match: { workspaceId } },
      { $group: { _id: '$status', totalSpend: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    PurchaseOrder.aggregate([
      { $match: { workspaceId, status: { $in: ['approved', 'pending'] } } },
      {
        $group: {
          _id: {
            year: { $year: '$orderDate' },
            month: { $month: '$orderDate' },
          },
          totalSpend: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]),
  ]);

  // Pending approvals for current user
  const myPendingApprovals = await PurchaseOrder.countDocuments({
    workspaceId,
    approverUserId: user.id,
    status: 'pending',
  });

  // Top suppliers by spend
  const topSuppliers = await PurchaseOrder.aggregate([
    { $match: { workspaceId, status: { $in: ['approved', 'pending'] } } },
    { $group: { _id: '$supplier', totalSpend: { $sum: '$total' }, count: { $sum: 1 } } },
    { $sort: { totalSpend: -1 } },
    { $limit: 5 },
  ]);

  return NextResponse.json({
    success: true,
    data: {
      counts: { totalPOs, pendingPOs, approvedPOs, rejectedPOs, draftPOs, cancelledPOs, totalSuppliers, myPendingApprovals },
      recentPOs,
      spendByStatus,
      monthlySpend,
      topSuppliers,
    },
  });
}
