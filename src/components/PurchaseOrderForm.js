// Client-side form with simple submit handler
'use client';

// Simple stub form; wire to real handlers later.
export default function PurchaseOrderForm({ onSubmit }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    onSubmit?.(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Order Number
        </label>
        <input
          name="orderNumber"
          className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
          placeholder="PO-1001"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Total Amount
        </label>
        <input
          name="totalAmount"
          type="number"
          step="0.01"
          className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
          placeholder="1200.00"
          required
        />
      </div>
      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Save Purchase Order
      </button>
    </form>
  );
}
