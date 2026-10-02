import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import useFocusTrap from '../../hooks/useFocusTrap.js';
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { closeCartDrawer, selectCartDrawerOpen } from '../../features/ui/uiSlice.js';
import {
  quickUpdateQty,
  quickRemoveItem,
  selectCartItems,
  selectCartSubtotal,
} from '../../features/cart/cartSlice.js';

/** Rapid-tap safe: qty→0 routes to remove (idempotent DELETE) instead of PATCH 0. */
const changeQty = (dispatch, item, qty) => {
  if (qty <= 0) dispatch(quickRemoveItem(item.product));
  else dispatch(quickUpdateQty({ productId: item.product, qty }));
};

const FREE_SHIPPING_THRESHOLD = 75;

/** Free-shipping progress bar — fills as subtotal approaches the threshold. */
function ShippingProgress({ subtotal }) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const percent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const qualified = remaining === 0;

  return (
    <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
      <div className="flex items-center gap-2 text-sm">
        {qualified ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium text-emerald-700 dark:text-emerald-400">
              You've unlocked free shipping
            </span>
          </>
        ) : (
          <>
            <Truck className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            <span className="text-zinc-600 dark:text-zinc-400">
              Add{' '}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                ${remaining.toFixed(2)}
              </span>{' '}
              more for free shipping
            </span>
          </>
        )}
      </div>
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            qualified
              ? 'bg-emerald-500 dark:bg-emerald-500'
              : 'bg-zinc-900 dark:bg-zinc-100'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/** One cart line: thumbnail, name, price, quantity stepper, remove. */
function CartLine({ item }) {
  const dispatch = useDispatch();
  const lineTotal = (item.price * item.qty).toFixed(2);
  const busy = item.price === 0; // placeholder line while optimistic add resolves

  return (
    <li className="flex gap-4 py-4">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ShoppingBag className="h-6 w-6 text-zinc-300 dark:text-zinc-700" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {item.name}
          </p>
          <p className="whitespace-nowrap text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            ${lineTotal}
          </p>
        </div>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          ${item.price?.toFixed(2)} each
        </p>

        <div className="mt-auto flex items-center justify-between pt-2">
          {/* Quantity stepper */}
          <div className="flex h-8 items-center rounded-lg border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => changeQty(dispatch, item, item.qty - 1)}
              disabled={busy}
              className="flex h-full w-8 items-center justify-center rounded-l-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              aria-label={`Decrease quantity of ${item.name}`}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-medium tabular-nums">{item.qty}</span>
            <button
              onClick={() => changeQty(dispatch, item, item.qty + 1)}
              disabled={busy}
              className="flex h-full w-8 items-center justify-center rounded-r-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              aria-label={`Increase quantity of ${item.name}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={() => dispatch(quickRemoveItem(item.product))}
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            aria-label={`Remove ${item.name} from cart`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </li>
  );
}

/** Empty state — muted, centered, one clear CTA. */
function EmptyState({ onClose }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
        <ShoppingBag className="h-6 w-6 text-zinc-400 dark:text-zinc-600" />
      </div>
      <div>
        <p className="font-semibold text-zinc-900 dark:text-zinc-100">Your cart is empty</p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Browse the catalog and find something you love.
        </p>
      </div>
      <button
        onClick={onClose}
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Continue shopping
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function CartDrawer() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const open = useSelector(selectCartDrawerOpen);
  // Focus trap: Tab cycles inside the sheet; focus returns to the trigger on close.
  const trapRef = useFocusTrap({
    active: open,
    onClose: useCallback(() => dispatch(closeCartDrawer()), [dispatch]),
  });
  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  // Exit animation: keep mounted one tick longer while playing slide-out
  const [rendered, setRendered] = useState(open);

  useEffect(() => {
    if (open) {
      setRendered(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      const t = setTimeout(() => setRendered(false), 260); // match slide-out duration
      return () => clearTimeout(t);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!rendered) return null;

  const goCheckout = () => {
    dispatch(closeCartDrawer());
    navigate('/checkout');
  };
  const goCart = () => {
    dispatch(closeCartDrawer());
    navigate('/cart');
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping cart" ref={trapRef} tabIndex={-1}>
      {/* Backdrop */}
      <div
        onClick={() => dispatch(closeCartDrawer())}
        className={`absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px] transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Sheet */}
      <div
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-overlay dark:border-zinc-800 dark:bg-zinc-950 ${
          open ? 'animate-slide-in-right' : 'animate-slide-out-right'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <ShoppingBag className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />
            Cart
            {items.length > 0 && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {items.reduce((n, i) => n + i.qty, 0)}
              </span>
            )}
          </h2>
          <button
            onClick={() => dispatch(closeCartDrawer())}
            className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <EmptyState onClose={() => dispatch(closeCartDrawer())} />
        ) : (
          <>
            <ShippingProgress subtotal={subtotal} />

            {/* Items */}
            <ul className="flex-1 divide-y divide-zinc-100 overflow-y-auto px-5 dark:divide-zinc-800/60">
              {items.map((item) => (
                <CartLine key={item.product} item={item} />
              ))}
            </ul>

            {/* Footer */}
            <div className="border-t border-zinc-200 bg-zinc-50/60 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/40">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Subtotal</span>
                <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                Taxes and shipping calculated at checkout.
              </p>
              <button
                onClick={goCheckout}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-50 transition hover:bg-zinc-700 active:scale-[0.99] dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                Checkout
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={goCart}
                className="mt-2 w-full rounded-lg py-2 text-center text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                View full cart
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
