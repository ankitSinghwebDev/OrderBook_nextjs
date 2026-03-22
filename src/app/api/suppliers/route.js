import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import Supplier from '@/models/Supplier';

export async function GET(req) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'active';

  const query = { workspaceId: user.workspaceId };
  if (status !== 'all') query.status = status;

  const suppliers = await Supplier.find(query).sort({ name: 1 }).lean();
  return NextResponse.json({ success: true, data: suppliers });
}

export async function POST(req) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  await connectDB();
  const body = await req.json();
  const { name, email, phone, contactPerson, companyName, address, city, state, country, pincode, gstNumber, panNumber, bankDetails, paymentTerms } = body || {};

  if (!name?.trim()) {
    return NextResponse.json({ success: false, message: 'Supplier name is required' }, { status: 400 });
  }

  const existing = await Supplier.findOne({ workspaceId: user.workspaceId, name: name.trim() });
  if (existing) {
    return NextResponse.json({ success: false, message: 'Supplier with this name already exists' }, { status: 409 });
  }

  const supplier = await Supplier.create({
    name: name.trim(),
    email: email || '',
    phone: phone || '',
    contactPerson: contactPerson || '',
    companyName: companyName || '',
    address: address || '',
    city: city || '',
    state: state || '',
    country: country || '',
    pincode: pincode || '',
    gstNumber: gstNumber || '',
    panNumber: panNumber || '',
    bankDetails: bankDetails || {},
    paymentTerms: paymentTerms || 'Net 30',
    workspaceId: user.workspaceId,
    createdByUserId: user.id,
  });

  return NextResponse.json({ success: true, data: supplier }, { status: 201 });
}
