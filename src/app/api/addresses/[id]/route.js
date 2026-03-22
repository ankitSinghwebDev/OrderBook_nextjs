import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import Address from '@/models/Address';

export async function GET(req, { params }) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const address = await Address.findOne({ _id: id, workspaceId: user.workspaceId }).lean();
  if (!address) {
    return NextResponse.json({ success: false, message: 'Address not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: address });
}

export async function PATCH(req, { params }) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const body = await req.json();

  if (body.isDefault) {
    await Address.updateMany(
      { workspaceId: user.workspaceId, isDefault: true },
      { $set: { isDefault: false } }
    );
  }

  const address = await Address.findOneAndUpdate(
    { _id: id, workspaceId: user.workspaceId },
    { $set: body },
    { new: true, runValidators: true }
  );

  if (!address) {
    return NextResponse.json({ success: false, message: 'Address not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: address });
}

export async function DELETE(req, { params }) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  await connectDB();
  const { id } = await params;

  const address = await Address.findOneAndUpdate(
    { _id: id, workspaceId: user.workspaceId },
    { $set: { status: 'inactive' } },
    { new: true }
  );

  if (!address) {
    return NextResponse.json({ success: false, message: 'Address not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: address });
}
