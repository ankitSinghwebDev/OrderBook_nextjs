import mongoose from 'mongoose';

const WorkspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    workspaceId: { type: String, required: true, unique: true, index: true },
    joinCode: { type: String, required: true, unique: true, index: true },
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    membersCount: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Workspace || mongoose.model('Workspace', WorkspaceSchema);
