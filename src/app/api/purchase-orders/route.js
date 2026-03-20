import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import PurchaseOrder from '@/models/PurchaseOrder';
import AuditLog from '@/models/AuditLog';
import User from '@/models/User';
import { getNextPONumber } from '@/models/Counter';
import { notifyApproverNewPO } from '@/lib/poNotifications';

function computeTotals(items = [], shipping = 0, discount = 0) {
  const subtotal = items.reduce((sum, item) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    return sum + qty * rate;
  }, 0);
  const taxTotal = items.reduce((sum, item) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const tax = Number(item.tax) || 0;
    return sum + (qty * rate * tax) / 100;
  }, 0);
  const total = subtotal + taxTotal + Number(shipping || 0) - Number(discount || 0);
  return { subtotal, taxTotal, total };
}

export async function GET(req) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  await connectDB();
  const { searchParams } = new URL(req.url);

  // Pagination
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
  const skip = (page - 1) * limit;

  // Filters — always scoped to workspace
  const query = { workspaceId: user.workspaceId };

  const status = searchParams.get('status');
  if (status && status !== 'all') query.status = status;

  const supplierId = searchParams.get('supplierId');
  if (supplierId) query.supplierId = supplierId;

  const search = searchParams.get('search')?.trim();
  if (search) {
    query.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { supplier: { $regex: search, $options: 'i' } },
    ];
  }

  // Date range
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');
  if (fromDate || toDate) {
    query.orderDate = {};
    if (fromDate) query.orderDate.$gte = new Date(fromDate);
    if (toDate) query.orderDate.$lte = new Date(toDate);
  }

  // Sort
  const sortField = searchParams.get('sortBy') || 'createdAt';
  const sortDir = searchParams.get('sortDir') === 'asc' ? 1 : -1;

  const [orders, totalCount] = await Promise.all([
    PurchaseOrder.find(query)
      .sort({ [sortField]: sortDir })
      .skip(skip)
      .limit(limit)
      .lean(),
    PurchaseOrder.countDocuments(query),
  ]);

  return NextResponse.json({
    success: true,
    data: orders,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
}

export async function POST(req) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  await connectDB();
  const body = await req.json();
  const {
    supplier,
    supplierId,
    orderDate,
    expectedDeliveryDate,
    currency,
    deliveryAddress,
    deliveryAddressId,
    paymentTerms,
    notes,
    internalNotes,
    items = [],
    shipping = 0,
    discount = 0,
    approverUserId,
    status: requestedStatus,
  } = body || {};

  if (!supplier || !orderDate || !currency) {
    return NextResponse.json({ success: false, message: 'supplier, orderDate, and currency are required' }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ success: false, message: 'At least one item is required' }, { status: 400 });
  }

  // Auto-generate PO number
  const orderNumber = await getNextPONumber(user.workspaceId);

  const normalizedItems = items.map((item) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const tax = Number(item.tax) || 0;
    const amount = qty * rate + (qty * rate * tax) / 100;
    return {
      name: String(item.name || '').trim() || 'Item',
      description: String(item.description || '').trim(),
      qty, rate, tax, amount,
    };
  });

  const { subtotal, taxTotal, total } = computeTotals(normalizedItems, shipping, discount);

  // Lookup creator name
  let createdByName = '';
  try {
    const creator = await User.findById(user.id).select('name').lean();
    if (creator) createdByName = creator.name;
  } catch { /* ignore */ }

  // Lookup approver name
  let approverName = '';
  if (approverUserId) {
    try {
      const approver = await User.findById(approverUserId).select('name').lean();
      if (approver) approverName = approver.name;
    } catch { /* ignore */ }
  }

  const poStatus = requestedStatus === 'draft' ? 'draft' : 'pending';

  const created = await PurchaseOrder.create({
    orderNumber,
    supplier: String(supplier).trim(),
    supplierId: supplierId || null,
    orderDate: new Date(orderDate),
    expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
    currency: String(currency).trim(),
    workspaceId: user.workspaceId,
    deliveryAddress: deliveryAddress || '',
    deliveryAddressId: deliveryAddressId || null,
    paymentTerms: paymentTerms || 'Net 30',
    notes: notes || '',
    internalNotes: internalNotes || '',
    items: normalizedItems,
    shipping: Number(shipping) || 0,
    discount: Number(discount) || 0,
    subtotal, taxTotal, total,
    approverUserId: approverUserId || null,
    approverName,
    createdByUserId: user.id,
    createdByName,
    status: poStatus,
  });

  // Audit log
  await AuditLog.create({
    entityType: 'PurchaseOrder',
    entityId: created._id,
    action: 'created',
    changes: { orderNumber, supplier, total, status: poStatus },
    performedByUserId: user.id,
    performedByName: createdByName,
    performedByEmail: user.email,
    workspaceId: user.workspaceId,
  });

  // Notify approver if PO is submitted (not draft) and has an approver
  if (poStatus === 'pending' && approverUserId) {
    notifyApproverNewPO(created).catch(() => {});
  }

  return NextResponse.json({ success: true, data: created }, { status: 201 });
}
