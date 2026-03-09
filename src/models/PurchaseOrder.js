import mongoose from 'mongoose';

const PurchaseOrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    supplier: { type: String, required: true, trim: true },
    orderDate: { type: Date, required: true },
    currency: { type: String, required: true, default: 'USD' },
    workspaceId: { type: String, index: true },
    deliveryAddress: { type: String },
    notes: { type: String },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    items: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        rate: { type: Number, required: true },
        tax: { type: Number, default: 0 },
        amount: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true },
    taxTotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    approverUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.models.PurchaseOrder ||
  mongoose.model('PurchaseOrder', PurchaseOrderSchema);
