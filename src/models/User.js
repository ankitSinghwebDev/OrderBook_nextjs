import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phoneNumber: { type: String, default: '' },
    companyName: { type: String, default: '', trim: true },
    isIndiaB2B: { type: Boolean, default: false },
    gstNumber: { type: String, default: '', trim: true },
    companyAddress: { type: String, default: '', trim: true },
    // Workspace / membership
    workspaceId: { type: String, default: '', index: true },
    isCreator: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ['admin', 'manager', 'viewer', 'user'],
      default: 'viewer',
    },
    passwordHash: { type: String },
    resetToken: { type: String },
    resetExpires: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
