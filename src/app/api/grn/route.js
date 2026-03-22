import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import GoodsReceivedNote from '@/models/GoodsReceivedNote';
import PurchaseOrder from '@/models/PurchaseOrder';
import User from '@/models/User';
import { getNextGRNNumber } from '@/models/Counter';
import AuditLog from '@/models/AuditLog';
import { createNotification } from '@/lib/notifications';

export async function GET(req) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const poId = searchParams.get('purchaseOrderId');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));

  const query = { workspaceId: user.workspaceId };
  if (poId) query.purchaseOrderId = poId;

  const [data, totalCount] = await Promise.all([
    GoodsReceivedNote.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    GoodsReceivedNote.countDocuments(query),
  ]);

  return NextResponse.json({ success: true, data, pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) } });
}

export async function POST(req) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  await connectDB();
  const body = await req.json();
  const { purchaseOrderId, receivedDate, deliveryNoteNumber, vehicleNumber, receivedBy, items, notes } = body;

  if (!purchaseOrderId || !items?.length) {
    return NextResponse.json({ success: false, message: 'purchaseOrderId and items are required' }, { status: 400 });
  }

  const po = await PurchaseOrder.findOne({ _id: purchaseOrderId, workspaceId: user.workspaceId });
  if (!po) return NextResponse.json({ success: false, message: 'PO not found' }, { status: 404 });

  let createdByName = '';
  try { const u = await User.findById(user.id).select('name').lean(); createdByName = u?.name || ''; } catch {}

  const grnNumber = await getNextGRNNumber(user.workspaceId);

  // Calculate status based on received vs ordered
  const totalOrdered = items.reduce((s, i) => s + (Number(i.orderedQty) || 0), 0);
  const totalAccepted = items.reduce((s, i) => s + (Number(i.acceptedQty) || 0), 0);
  const status = totalAccepted >= totalOrdered ? 'completed' : 'partial';

  const grn = await GoodsReceivedNote.create({
    grnNumber,
    purchaseOrderId: po._id,
    poNumber: po.orderNumber,
    supplier: po.supplier,
    supplierId: po.supplierId,
    receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
    deliveryNoteNumber: deliveryNoteNumber || '',
    vehicleNumber: vehicleNumber || '',
    receivedBy: receivedBy || createdByName,
    items,
    status,
    notes: notes || '',
    workspaceId: user.workspaceId,
    createdByUserId: user.id,
    createdByName,
  });

  await AuditLog.create({
    entityType: 'PurchaseOrder', entityId: po._id, action: 'updated',
    changes: { grn: grnNumber, status: `GRN ${status}` },
    performedByUserId: user.id, performedByName: createdByName, performedByEmail: user.email,
    workspaceId: user.workspaceId,
  });

  // Notify PO creator
  if (po.createdByUserId?.toString() !== user.id) {
    createNotification({
      userId: po.createdByUserId, type: 'grn_created',
      title: `GRN created for ${po.orderNumber}`,
      message: `${createdByName} recorded goods receipt (${grnNumber}). Status: ${status}`,
      link: `/grn/${grn._id}`, entityType: 'GoodsReceivedNote', entityId: grn._id,
      workspaceId: user.workspaceId,
    });
  }

  return NextResponse.json({ success: true, data: grn }, { status: 201 });
}
