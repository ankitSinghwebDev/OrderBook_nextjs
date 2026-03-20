import mongoose from 'mongoose';

const SupplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, default: '', lowercase: true, trim: true },
    phone: { type: String, default: '', trim: true },
    contactPerson: { type: String, default: '', trim: true },
    companyName: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    country: { type: String, default: '', trim: true },
    pincode: { type: String, default: '', trim: true },
    gstNumber: { type: String, default: '', trim: true },
    panNumber: { type: String, default: '', trim: true },
    bankDetails: {
      bankName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
    },
    paymentTerms: { type: String, default: 'Net 30', trim: true },
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

SupplierSchema.index({ workspaceId: 1, name: 1 }, { unique: true });

export default mongoose.models.Supplier ||
  mongoose.model('Supplier', SupplierSchema);
