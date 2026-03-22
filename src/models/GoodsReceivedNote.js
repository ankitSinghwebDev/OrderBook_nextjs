import mongoose from 'mongoose';

const GRNItemSchema = new mongoose.Schema({
  poItemIndex: { type: Number },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  orderedQty: { type: Number, required: true },
  previouslyReceivedQty: { type: Number, default: 0 },
  receivedQty: { type: Number, required: true },
  rejectedQty: { type: Number, default: 0 },
  acceptedQty: { type: Number, required: true },
  remarks: { type: String, default: '' },
});

const GoodsReceivedNoteSchema = new mongoose.Schema(
  {
    grnNumber: { type: String, required: true, unique: true },
    purchaseOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true, index: true },
    poNumber: { type: String, required: true },
    supplier: { type: String, required: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    receivedDate: { type: Date, required: true },
    deliveryNoteNumber: { type: String, default: '' },
    vehicleNumber: { type: String, default: '' },
    receivedBy: { type: String, default: '' },
    items: [GRNItemSchema],
    status: {
      type: String,
      enum: ['draft', 'completed', 'partial'],
      default: 'completed',
      index: true,
    },
    notes: { type: String, default: '' },
    workspaceId: { type: String, required: true, index: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdByName: { type: String, default: '' },
  },
  { timestamps: true }
);

GoodsReceivedNoteSchema.index({ workspaceId: 1, createdAt: -1 });

export default mongoose.models.GoodsReceivedNote ||
  mongoose.model('GoodsReceivedNote', GoodsReceivedNoteSchema);
