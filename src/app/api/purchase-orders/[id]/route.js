import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth, requireRole } from '@/lib/auth';
import PurchaseOrder from '@/models/PurchaseOrder';
import AuditLog from '@/models/AuditLog';
import User from '@/models/User';
import { notifyApproverNewPO, notifyCreatorPODecision } from '@/lib/poNotifications';

function computeTotals(items = [], shipping = 0, discount = 0) {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.rate) || 0), 0);
  const taxTotal = items.reduce((sum, item) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const tax = Number(item.tax) || 0;
    return sum + (qty * rate * tax) / 100;
  }, 0);
  return { subtotal, taxTotal, total: subtotal + taxTotal + Number(shipping || 0) - Number(discount || 0) };
}

// Valid status transitions
const VALID_TRANSITIONS = {
  draft: ['pending', 'cancelled'],
  pending: ['approved', 'rejected', 'cancelled'],
  rejected: ['pending', 'cancelled'],
  approved: ['cancelled'],
  cancelled: [],
};

// GET /api/purchase-orders/[id] — detail view
export async function GET(req, { params }) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  await connectDB();
  const { id } = await params;

  const po = await PurchaseOrder.findOne({ _id: id, workspaceId: user.workspaceId }).lean();
  if (!po) {
    return NextResponse.json({ success: false, message: 'Purchase order not found' }, { status: 404 });
  }

  // Fetch audit history
  const history = await AuditLog.find({ entityType: 'PurchaseOrder', entityId: id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return NextResponse.json({ success: true, data: { ...po, history } });
}

// PATCH /api/purchase-orders/[id] — update PO (edit or status change)
export async function PATCH(req, { params }) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const body = await req.json();

  const po = await PurchaseOrder.findOne({ _id: id, workspaceId: user.workspaceId });
  if (!po) {
    return NextResponse.json({ success: false, message: 'Purchase order not found' }, { status: 404 });
  }

  // Status change action
  if (body.action) {
    return handleStatusChange(req, po, body, user);
  }

  // Regular edit — only allowed on draft or pending
  if (!['draft', 'pending'].includes(po.status)) {
    return NextResponse.json({
      success: false,
      message: `Cannot edit a PO with status '${po.status}'`,
    }, { status: 400 });
  }

  const previousValues = {};
  const changes = {};

  // Editable fields
  const editableFields = [
    'supplier', 'supplierId', 'orderDate', 'expectedDeliveryDate', 'currency',
    'deliveryAddress', 'deliveryAddressId', 'paymentTerms', 'notes', 'internalNotes',
    'approverUserId', 'shipping', 'discount',
  ];

  for (const field of editableFields) {
    if (body[field] !== undefined) {
      previousValues[field] = po[field];
      po[field] = body[field];
      changes[field] = body[field];
    }
  }

  // Update items if provided
  if (body.items && Array.isArray(body.items)) {
    previousValues.items = po.items;
    po.items = body.items.map((item) => {
      const qty = Number(item.qty) || 0;
      const rate = Number(item.rate) || 0;
      const tax = Number(item.tax) || 0;
      return {
        name: String(item.name || '').trim() || 'Item',
        description: String(item.description || '').trim(),
        qty, rate, tax,
        amount: qty * rate + (qty * rate * tax) / 100,
      };
    });
    changes.items = 'updated';
  }

  // Recompute totals
  const { subtotal, taxTotal, total } = computeTotals(po.items, po.shipping, po.discount);
  po.subtotal = subtotal;
  po.taxTotal = taxTotal;
  po.total = total;

  // Update approver name if changed
  if (body.approverUserId) {
    try {
      const approver = await User.findById(body.approverUserId).select('name').lean();
      po.approverName = approver?.name || '';
    } catch { /* ignore */ }
  }

  await po.save();

  // Audit
  let performerName = '';
  try {
    const performer = await User.findById(user.id).select('name').lean();
    performerName = performer?.name || '';
  } catch { /* ignore */ }

  await AuditLog.create({
    entityType: 'PurchaseOrder',
    entityId: po._id,
    action: 'updated',
    changes,
    previousValues,
    performedByUserId: user.id,
    performedByName: performerName,
    performedByEmail: user.email,
    workspaceId: user.workspaceId,
  });

  return NextResponse.json({ success: true, data: po });
}

async function handleStatusChange(req, po, body, user) {
  const { action, comment } = body;

  const statusMap = {
    approve: 'approved',
    reject: 'rejected',
    submit: 'pending',
    cancel: 'cancelled',
  };

  const newStatus = statusMap[action];
  if (!newStatus) {
    return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 400 });
  }

  const allowed = VALID_TRANSITIONS[po.status] || [];
  if (!allowed.includes(newStatus)) {
    return NextResponse.json({
      success: false,
      message: `Cannot transition from '${po.status}' to '${newStatus}'`,
    }, { status: 400 });
  }

  // Approve/reject requires being the assigned approver or admin
  if (action === 'approve' || action === 'reject') {
    const isApprover = po.approverUserId?.toString() === user.id;
    const isAdmin = user.role === 'admin';
    if (!isApprover && !isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Only the assigned approver or admin can approve/reject',
      }, { status: 403 });
    }
  }

  const previousStatus = po.status;
  po.status = newStatus;

  if (action === 'approve') {
    po.approvalComment = comment || '';
    po.approvedAt = new Date();
    po.rejectedAt = null;
    po.rejectionReason = '';
  } else if (action === 'reject') {
    po.rejectionReason = comment || '';
    po.rejectedAt = new Date();
    po.approvedAt = null;
    po.approvalComment = '';
  }

  await po.save();

  let performerName = '';
  try {
    const performer = await User.findById(user.id).select('name').lean();
    performerName = performer?.name || '';
  } catch { /* ignore */ }

  await AuditLog.create({
    entityType: 'PurchaseOrder',
    entityId: po._id,
    action: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'status_changed',
    changes: { status: newStatus, previousStatus },
    previousValues: { status: previousStatus },
    performedByUserId: user.id,
    performedByName: performerName,
    performedByEmail: user.email,
    comment: comment || '',
    workspaceId: user.workspaceId,
  });

  // Send email notifications (non-blocking)
  if (action === 'submit') {
    notifyApproverNewPO(po).catch(() => {});
  } else if (action === 'approve' || action === 'reject') {
    notifyCreatorPODecision(po, action === 'approve' ? 'approved' : 'rejected', comment).catch(() => {});
  }

  return NextResponse.json({ success: true, data: po });
}

// DELETE (soft — sets status to cancelled)
export async function DELETE(req, { params }) {
  const { user, error } = requireRole(req, ['admin', 'manager']);
  if (error) return error;

  await connectDB();
  const { id } = await params;

  const po = await PurchaseOrder.findOne({ _id: id, workspaceId: user.workspaceId });
  if (!po) {
    return NextResponse.json({ success: false, message: 'Purchase order not found' }, { status: 404 });
  }

  po.status = 'cancelled';
  await po.save();

  let performerName = '';
  try {
    const performer = await User.findById(user.id).select('name').lean();
    performerName = performer?.name || '';
  } catch { /* ignore */ }

  await AuditLog.create({
    entityType: 'PurchaseOrder',
    entityId: po._id,
    action: 'deleted',
    changes: { status: 'cancelled' },
    performedByUserId: user.id,
    performedByName: performerName,
    performedByEmail: user.email,
    workspaceId: user.workspaceId,
  });

  return NextResponse.json({ success: true, data: po });
}
