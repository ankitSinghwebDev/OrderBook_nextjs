export default function PurchaseOrderTable({ orders = [] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
              Order #
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
              Total
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
              Created
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {orders.length === 0 && (
            <tr>
              <td
                colSpan="4"
                className="px-4 py-6 text-center text-sm text-slate-500"
              >
                No purchase orders yet.
              </td>
            </tr>
          )}
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="px-4 py-3 text-sm font-medium text-slate-900">
                {order.orderNumber || order.id}
              </td>
              <td className="px-4 py-3 text-sm text-slate-700">
                {order.status}
              </td>
              <td className="px-4 py-3 text-sm text-slate-700">
                ${Number(order.totalAmount || 0).toFixed(2)}
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString()
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
