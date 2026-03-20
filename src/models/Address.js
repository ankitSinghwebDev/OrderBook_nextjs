import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, default: '', trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, default: '', trim: true },
    pincode: { type: String, default: '', trim: true },
    country: { type: String, required: true, trim: true },
    phone: { type: String, default: '', trim: true },
    contactPerson: { type: String, default: '', trim: true },
    isDefault: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
    workspaceId: { type: String, required: true, index: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

AddressSchema.index({ workspaceId: 1, label: 1 });

export default mongoose.models.Address ||
  mongoose.model('Address', AddressSchema);
