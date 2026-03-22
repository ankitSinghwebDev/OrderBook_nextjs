import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import Address from '@/models/Address';

export async function GET(req) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'active';

  const query = { workspaceId: user.workspaceId };
  if (status !== 'all') query.status = status;

  const addresses = await Address.find(query).sort({ isDefault: -1, label: 1 }).lean();
  return NextResponse.json({ success: true, data: addresses });
}

export async function POST(req) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  await connectDB();
  const body = await req.json();
  const { label, line1, line2, city, state, pincode, country, phone, contactPerson, isDefault } = body || {};

  if (!label?.trim() || !line1?.trim() || !city?.trim() || !country?.trim()) {
    return NextResponse.json({ success: false, message: 'label, line1, city, and country are required' }, { status: 400 });
  }

  if (isDefault) {
    await Address.updateMany(
      { workspaceId: user.workspaceId, isDefault: true },
      { $set: { isDefault: false } }
    );
  }

  const address = await Address.create({
    label: label.trim(),
    line1: line1.trim(),
    line2: line2 || '',
    city: city.trim(),
    state: state || '',
    pincode: pincode || '',
    country: country.trim(),
    phone: phone || '',
    contactPerson: contactPerson || '',
    isDefault: !!isDefault,
    workspaceId: user.workspaceId,
    createdByUserId: user.id,
  });

  return NextResponse.json({ success: true, data: address }, { status: 201 });
}
