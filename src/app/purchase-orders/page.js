import Link from 'next/link';

export default function PurchaseOrdersPage() {
  return (
    <div className="min-h-screen bg-[#f6f8fb] py-10">
      <div className="mx-auto max-w-6xl px-6 space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">All Purchase Orders</h1>
          <p className="text-sm text-slate-600">
            This is a placeholder list page. Hook it to your data and filters.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <p className="text-sm text-slate-700">
            No purchase orders to show yet. Click{" "}
            <Link href="/create-new-po" prefetch className="text-indigo-600 font-semibold hover:text-indigo-700">
              Create a new PO
            </Link>{" "}
            to get started.
          </p>
        </div>
      </div>
    </div>
  );
}
