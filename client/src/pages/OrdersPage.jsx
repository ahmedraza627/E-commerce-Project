import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { PackageOpen, ChevronRight } from 'lucide-react';
import { fetchMyOrders } from '../features/orders/ordersSlice.js';

const STATUS_STYLES = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-400',
  processing: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-400',
  shipped: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-400',
  delivered: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400',
  cancelled: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400',
};

export default function OrdersPage() {
  const dispatch = useDispatch();
  const { items, pagination, status } = useSelector((s) => s.orders);

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  return (
    <div className="py-2">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">My orders</h1>

      {status === 'loading' && !items.length ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-800">
          <PackageOpen className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No orders yet.</p>
          <Link
            to="/"
            className="text-sm font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition hover:decoration-zinc-900 dark:text-zinc-100 dark:decoration-zinc-700"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((order) => (
            <li key={order._id}>
              <Link
                to={`/orders/${order._id}`}
                className="group flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
              >
                <div>
                  <p className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {order.orderNumber}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {new Date(order.createdAt).toLocaleDateString()} · {order.orderItems.length} item
                    {order.orderItems.length > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLES[order.status]}`}
                  >
                    {order.status}
                  </span>
                  <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    ${order.totalPrice.toFixed(2)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-zinc-500 dark:text-zinc-600" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pagination.pages > 1 && (
        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Page {pagination.page} of {pagination.pages}
        </p>
      )}
    </div>
  );
}
