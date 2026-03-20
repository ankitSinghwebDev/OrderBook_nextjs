import mongoose from 'mongoose';

const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model('Counter', CounterSchema);

/**
 * Get the next PO number for a workspace.
 * Format: PO-YYYY-NNNN (e.g., PO-2026-0001)
 */
export async function getNextPONumber(workspaceId) {
  const year = new Date().getFullYear();
  const counterId = `po_${workspaceId}_${year}`;

  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `PO-${year}-${String(counter.seq).padStart(4, '0')}`;
}

export default Counter;
