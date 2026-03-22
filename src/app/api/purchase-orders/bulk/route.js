import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireRole } from '@/lib/auth';
import PurchaseOrder from '@/models/PurchaseOrder';
import AuditLog from '@/models/AuditLog';
import User from '@/models/User';
import { createNotification } from '@/lib/notifications';

export async function POST(req) {
  const { user, error } = requireRole(req, ['admin', 'manager']);
  if (error) return error;

  await connectDB();
  const { action, ids, comment } = await req.json();

  if (!ids?.length) return NextResponse.json({ success: false, message: 'No PO IDs provided' }, { status: 400 });
  if (!['approve', 'reject', 'cancel'].includes(action)) {
    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  }

  const statusMap = { approve: 'approved', reject: 'rejected', cancel: 'cancelled' };
  const newStatus = statusMap[action];

  let performerName = '';
  try { const u = await User.findById(user.id).select('name').lean(); performerName = u?.name || ''; } catch {}

  const results = { success: 0, failed: 0, errors: [] };

  for (const id of ids) {
    try {
      const po = await PurchaseOrder.findOne({ _id: id, workspaceId: user.workspaceId });
      if (!po) { results.failed++; results.errors.push(`${id}: not found`); continue; }

      const validFrom = { approve: ['pending'], reject: ['pending'], cancel: ['draft', 'pending', 'approved'] };
      if (!validFrom[action].includes(po.status)) {
        results.failed++; results.errors.push(`${po.orderNumber}: cannot ${action} from ${po.status}`); continue;
      }

      const prev = po.status;
      po.status = newStatus;
      if (action === 'approve') { po.approvalComment = comment || ''; po.approvedAt = new Date(); }
      if (action === 'reject') {
        if (!comment) { results.failed++; results.errors.push(`${po.orderNumber}: rejection reason required`); continue; }
        po.rejectionReason = comment; po.rejectedAt = new Date();
      }
      await po.save();

      await AuditLog.create({
        entityType: 'PurchaseOrder', entityId: po._id,
        action: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'status_changed',
        changes: { status: newStatus, previousStatus: prev, bulk: true },
        previousValues: { status: prev },
        performedByUserId: user.id, performedByName: performerName, performedByEmail: user.email,
        comment: comment || '', workspaceId: user.workspaceId,
      });

      // Notify creator
      if (po.createdByUserId?.toString() !== user.id) {
        createNotification({
          userId: po.createdByUserId, type: action === 'approve' ? 'po_approved' : action === 'reject' ? 'po_rejected' : 'general',
          title: `${po.orderNumber} ${newStatus}`, message: `${performerName} ${newStatus} your PO${comment ? ': ' + comment.slice(0, 80) : ''}`,
          link: `/purchase-orders/${po._id}`, entityType: 'PurchaseOrder', entityId: po._id, workspaceId: user.workspaceId,
        });
      }

      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push(`${id}: ${err.message}`);
    }
  }

  return NextResponse.json({ success: true, data: results });
}
