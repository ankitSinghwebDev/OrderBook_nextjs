import mongoose from 'mongoose';

const WorkspaceMemberSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, default: 'viewer', trim: true },
    joinedAt: { type: Date, default: Date.now },
    isOwner: { type: Boolean, default: false },
  },
  { timestamps: true }
);

WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

export default mongoose.models.WorkspaceMember || mongoose.model('WorkspaceMember', WorkspaceMemberSchema);
