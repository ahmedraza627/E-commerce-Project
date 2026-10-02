import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeft, MapPin, CreditCard, ReceiptText, ShoppingBag } from 'lucide-react';
import { fetchOrder } from '../features/orders/ordersSlice.js';

export default function OrderDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current: order, status } = useSelector((s) => s.orders);

  useEffect(() => {
    dispatch(fetchOrder(id));
  }, [dispatch, id]);

  if (status === 'loading' || (!order && status === 'idle')) {
    return (
      <div className="space-y-4 py-4">
        <div className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
        <div className="h-64 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Order not found</p>
        <Link
          to="/orders"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ChevronLeft className="h-4 w-4" /> Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="py-2">
      <nav className="mb-4 flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
        <Link to="/orders" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
          My orders
        </Link>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        <span className="font-mono text-zinc-900 dark:text-zinc-100">{order.orderNumber}</span>
      </nav>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/40">
        <p className="font-semibold text-emerald-800 dark:text-emerald-300">
          Thank you — your order is confirmed
        </p>
        <p className="mt-0.5 text-sm capitalize text-emerald-700 dark:text-emerald-400">
          Placed {new Date(order.createdAt).toLocaleString()} · Status: {order.status}
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              <ReceiptText className="h-4 w-4 text-zinc-400" /> Items
            </h2>
            <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {order.orderItems.map((item, idx) => (
                <li key={idx} className="flex items-center gap-4 py-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-zinc-300 dark:text-zinc-700" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.name}</p>
                    <p className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                      ${item.price.toFixed(2)} × {item.qty}
                    </p>
                  </div>
                  <span className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                    ${(item.price * item.qty).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Shipping + payment */}
          <div className="grid gap-6 sm:grid-cols-2">
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                <MapPin className="h-4 w-4 text-zinc-400" /> Shipping address
              </h2>
              <address className="mt-3 text-sm not-italic leading-relaxed text-zinc-600 dark:text-zinc-400">
                {order.shippingAddress.fullName}
                <br />
                {order.shippingAddress.line1}
                {order.shippingAddress.line2 && <><br />{order.shippingAddress.line2}</>}
                <br />
                {order.shippingAddress.city}
                {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''}{' '}
                {order.shippingAddress.postalCode}
                <br />
                {order.shippingAddress.country}
              </address>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                <CreditCard className="h-4 w-4 text-zinc-400" /> Payment
              </h2>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                Method: <span className="font-medium uppercase text-zinc-900 dark:text-zinc-100">{order.paymentMethod}</span>
              </p>
              <p className="mt-1 text-sm">
                <span className={order.isPaid ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'font-medium text-amber-600 dark:text-amber-400'}>
                  {order.isPaid ? 'Paid' : 'Payment pending'}
                </span>
              </p>
            </section>
          </div>
        </div>

        {/* Summary */}
        <div className="h-fit rounded-2xl border border-zinc-200 bg-white p-6 lg:sticky lg:top-24 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Summary</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400">Items</dt>
              <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                ${order.itemsPrice.toFixed(2)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400">Shipping</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                {order.shippingPrice === 0 ? 'Free' : `$${order.shippingPrice.toFixed(2)}`}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400">Tax</dt>
              <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                ${order.taxPrice.toFixed(2)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-zinc-200 pt-3 text-base font-semibold dark:border-zinc-800">
              <dt className="text-zinc-900 dark:text-zinc-100">Total</dt>
              <dd className="tabular-nums text-zinc-900 dark:text-zinc-100">${order.totalPrice.toFixed(2)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
