import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      required: true,
      enum: ['PurchaseOrder', 'Supplier', 'Address'],
      index: true,
    },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    action: {
      type: String,
      required: true,
      enum: ['created', 'updated', 'status_changed', 'approved', 'rejected', 'deleted'],
    },
    changes: { type: mongoose.Schema.Types.Mixed, default: {} },
    previousValues: { type: mongoose.Schema.Types.Mixed, default: {} },
    performedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    performedByName: { type: String, default: '' },
    performedByEmail: { type: String, default: '' },
    comment: { type: String, default: '' },
    workspaceId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export default mongoose.models.AuditLog ||
  mongoose.model('AuditLog', AuditLogSchema);
