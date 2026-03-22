import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema(
  {
    entityType: { type: String, required: true, enum: ['PurchaseOrder', 'GoodsReceivedNote'], index: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    message: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, default: '' },
    userRole: { type: String, default: '' },
    workspaceId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

CommentSchema.index({ entityType: 1, entityId: 1, createdAt: 1 });

export default mongoose.models.Comment ||
  mongoose.model('Comment', CommentSchema);
