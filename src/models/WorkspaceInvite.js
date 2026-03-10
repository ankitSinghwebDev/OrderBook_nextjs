import mongoose from 'mongoose';

const WorkspaceInviteSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    joinCode: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, default: 'viewer', trim: true },
    invitedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired', 'revoked'],
      default: 'pending',
    },
    expiresAt: { type: Date },
    acceptedAt: { type: Date },
  },
  { timestamps: true }
);

WorkspaceInviteSchema.index({ workspaceId: 1, email: 1 }, { unique: true });

export default mongoose.models.WorkspaceInvite || mongoose.model('WorkspaceInvite', WorkspaceInviteSchema);
