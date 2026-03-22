import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ['po_created', 'po_approved', 'po_rejected', 'po_submitted', 'po_comment', 'grn_created', 'po_assigned', 'general'],
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '' },
    entityType: { type: String, default: '' },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false, index: true },
    workspaceId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export default mongoose.models.Notification ||
  mongoose.model('Notification', NotificationSchema);
