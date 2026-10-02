import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import {
  quickUpdateQty,
  quickRemoveItem,
  quickClearCart,
  selectCartItems,
  selectCartSubtotal,
  selectCartError,
} from '../features/cart/cartSlice.js';

/** Rapid-tap safe: qty→0 routes to remove (idempotent DELETE) instead of PATCH 0. */
const changeQty = (dispatch, productId, qty) => {
  if (qty <= 0) dispatch(quickRemoveItem(productId));
  else dispatch(quickUpdateQty({ productId, qty }));
};

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const error = useSelector(selectCartError);

  const shipping = subtotal >= 75 || subtotal === 0 ? 0 : 5.99;
  const tax = Number((subtotal * 0.08).toFixed(2));
  const total = (subtotal + shipping + tax).toFixed(2);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          <ShoppingBag className="h-6 w-6 text-zinc-400 dark:text-zinc-600" />
        </div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Your cart is empty</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Browse the catalog and add something you love.</p>
        <Link
          to="/"
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-zinc-50 transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Continue shopping <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="py-2">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Shopping cart</h1>
      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {/* Lines */}
        <ul className="divide-y divide-zinc-100 lg:col-span-2 dark:divide-zinc-800/60">
          {items.map((item) => (
            <li key={item.product} className="flex gap-4 py-5">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-zinc-300 dark:text-zinc-700" />
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <Link
                    to={`/products/${item.slug}`}
                    className="text-sm font-medium text-zinc-900 transition hover:underline decoration-zinc-300 underline-offset-4 sm:text-base dark:text-zinc-100 dark:decoration-zinc-700"
                  >
                    {item.name}
                  </Link>
                  <span className="whitespace-nowrap text-sm font-semibold tabular-nums sm:text-base dark:text-zinc-100">
                    ${(item.price * item.qty).toFixed(2)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">${item.price?.toFixed(2)} each</p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex h-9 items-center rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <button
                      onClick={() => changeQty(dispatch, item.product, item.qty - 1)}
                      className="flex h-full w-9 items-center justify-center text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium tabular-nums">{item.qty}</span>
                    <button
                      onClick={() => changeQty(dispatch, item.product, item.qty + 1)}
                      className="flex h-full w-9 items-center justify-center text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => dispatch(quickRemoveItem(item.product))}
                    className="rounded-lg p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Summary */}
        <div className="h-fit rounded-2xl border border-zinc-200 bg-white p-6 lg:sticky lg:top-24 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Order summary</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400">Subtotal</dt>
              <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">${subtotal.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400">Shipping</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400">Tax (8%)</dt>
              <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">${tax.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between border-t border-zinc-200 pt-3 text-base font-semibold dark:border-zinc-800">
              <dt className="text-zinc-900 dark:text-zinc-100">Total</dt>
              <dd className="tabular-nums text-zinc-900 dark:text-zinc-100">${total}</dd>
            </div>
          </dl>
          <button
            onClick={() => navigate('/checkout')}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-3 text-sm font-semibold text-zinc-50 transition hover:bg-zinc-700 active:scale-[0.99] dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Proceed to checkout <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => dispatch(quickClearCart())}
            className="mt-2 w-full rounded-lg py-2 text-sm text-zinc-500 transition hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
          >
            Clear cart
          </button>
        </div>
      </div>
    </div>
  );
}
