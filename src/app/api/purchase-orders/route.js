// GET /api/purchase-orders  - list purchase orders (optional filters)
// POST /api/purchase-orders - create a purchase order
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import PurchaseOrder from '@/models/PurchaseOrder';

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
  await connectDB();
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId') || undefined;
  const approverId = searchParams.get('approverUserId') || undefined;

  const query = {};
  if (workspaceId) query.workspaceId = workspaceId;
  if (approverId) query.approverUserId = approverId;

  const orders = await PurchaseOrder.find(query).lean();
  return NextResponse.json({ success: true, data: orders });
}

export async function POST(request) {
  await connectDB();
  const body = await request.json();
  const {
    poNumber,
    orderNumber,
    supplier,
    orderDate,
    currency,
    deliveryAddress,
    notes,
    workspaceId,
    items = [],
    shipping = 0,
    discount = 0,
    approverUserId,
    createdByUserId,
  } = body || {};

  const normalizedOrderNumber = String(orderNumber || poNumber || '').trim();
  if (!normalizedOrderNumber) {
    return NextResponse.json({ message: 'orderNumber (or poNumber) is required' }, { status: 400 });
  }
  if (!supplier || !orderDate || !currency) {
    return NextResponse.json({ message: 'supplier, orderDate, and currency are required' }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ message: 'At least one item is required' }, { status: 400 });
  }

  const normalizedItems = items.map((item) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const tax = Number(item.tax) || 0;
    const amount = qty * rate + (qty * rate * tax) / 100;
    return {
      name: String(item.name || '').trim() || 'Item',
      qty,
      rate,
      tax,
      amount,
    };
  });

  const { subtotal, taxTotal, total } = computeTotals(normalizedItems, shipping, discount);

  const payload = {
    orderNumber: normalizedOrderNumber,
    supplier: String(supplier || '').trim(),
    orderDate: new Date(orderDate),
    currency: String(currency || '').trim(),
    workspaceId: workspaceId || null,
    deliveryAddress: String(deliveryAddress || '').trim(),
    notes: String(notes || '').trim(),
    items: normalizedItems,
    shipping: Number(shipping) || 0,
    discount: Number(discount) || 0,
    subtotal,
    taxTotal,
    total,
    approverUserId: approverUserId || null,
    createdByUserId: createdByUserId || null,
    status: 'pending',
  };

  const created = await PurchaseOrder.create(payload);
  return NextResponse.json({ success: true, data: created }, { status: 201 });
}
