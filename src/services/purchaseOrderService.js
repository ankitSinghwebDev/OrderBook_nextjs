import { connectDB } from '@/lib/mongodb';
import PurchaseOrder from '@/models/PurchaseOrder';

export async function listPurchaseOrders() {
  await connectDB();
  return PurchaseOrder.find().lean();
}

export async function createPurchaseOrder(data) {
  await connectDB();
  return PurchaseOrder.create(data);
}
