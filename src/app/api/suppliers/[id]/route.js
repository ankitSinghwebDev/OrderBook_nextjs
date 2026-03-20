import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import Supplier from '@/models/Supplier';

export async function GET(req, { params }) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const supplier = await Supplier.findOne({ _id: id, workspaceId: user.workspaceId }).lean();
  if (!supplier) {
    return NextResponse.json({ success: false, message: 'Supplier not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: supplier });
}

export async function PATCH(req, { params }) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const body = await req.json();

  const supplier = await Supplier.findOneAndUpdate(
    { _id: id, workspaceId: user.workspaceId },
    { $set: body },
    { new: true, runValidators: true }
  );

  if (!supplier) {
    return NextResponse.json({ success: false, message: 'Supplier not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: supplier });
}

export async function DELETE(req, { params }) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  await connectDB();
  const { id } = await params;

  const supplier = await Supplier.findOneAndUpdate(
    { _id: id, workspaceId: user.workspaceId },
    { $set: { status: 'inactive' } },
    { new: true }
  );

  if (!supplier) {
    return NextResponse.json({ success: false, message: 'Supplier not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: supplier });
}
