import mongoose from 'mongoose';

const PurchaseOrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', index: true },
    supplier: { type: String, required: true, trim: true },
    orderDate: { type: Date, required: true },
    expectedDeliveryDate: { type: Date },
    currency: { type: String, required: true, default: 'USD' },
    workspaceId: { type: String, required: true, index: true },
    deliveryAddressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
    deliveryAddress: { type: String },
    paymentTerms: { type: String, default: 'Net 30', trim: true },
    notes: { type: String },
    internalNotes: { type: String },
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    items: [
      {
        name: { type: String, required: true },
        description: { type: String, default: '' },
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
    approverName: { type: String, default: '' },
    approvalComment: { type: String, default: '' },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    rejectionReason: { type: String, default: '' },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdByName: { type: String, default: '' },
    attachments: [
      {
        name: { type: String },
        url: { type: String },
        type: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

PurchaseOrderSchema.index({ workspaceId: 1, createdAt: -1 });
PurchaseOrderSchema.index({ workspaceId: 1, status: 1 });
PurchaseOrderSchema.index({ workspaceId: 1, supplier: 'text', orderNumber: 'text' });

export default mongoose.models.PurchaseOrder ||
  mongoose.model('PurchaseOrder', PurchaseOrderSchema);
