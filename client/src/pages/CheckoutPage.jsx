import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { CreditCard, Banknote, PackageCheck } from 'lucide-react';
import { placeOrder } from '../features/orders/ordersSlice.js';
import {
  quickClearCart,
  selectCartItems,
  selectCartSubtotal,
} from '../features/cart/cartSlice.js';
import { pushToast } from '../features/ui/uiSlice.js';
import Button from '../components/ui/Button.jsx';

const EMPTY_ADDRESS = {
  fullName: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
  phone: '',
};

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const { checkoutStatus, error } = useSelector((s) => s.orders);

  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [paymentMethod, setPaymentMethod] = useState('cod');

  const shipping = subtotal >= 75 || subtotal === 0 ? 0 : 5.99;
  const tax = Number((subtotal * 0.08).toFixed(2));
  const total = (subtotal + shipping + tax).toFixed(2);

  const set = (k) => (e) => setAddress((a) => ({ ...a, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      dispatch(pushToast('Your cart is empty', 'error'));
      return;
    }
    try {
      const order = await dispatch(placeOrder({ shippingAddress: address, paymentMethod })).unwrap();
      dispatch(quickClearCart());
      dispatch(pushToast('Order placed successfully!'));
      navigate(`/orders/${order.order._id}`);
    } catch (err) {
      dispatch(pushToast(err.message ?? 'Checkout failed', 'error'));
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          <PackageCheck className="h-6 w-6 text-zinc-400 dark:text-zinc-600" />
        </div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Nothing to check out</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Your cart is empty.</p>
        <Link
          to="/"
          className="mt-1 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-zinc-50 transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Back to shop
        </Link>
      </div>
    );
  }

  const field =
    'w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-50/10';
  const label = 'mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300';

  return (
    <div className="py-2">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Checkout</h1>

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Shipping address</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="fullName" className={label}>Full name</label>
                <input id="fullName" required value={address.fullName} onChange={set('fullName')} className={field} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="line1" className={label}>Address line 1</label>
                <input id="line1" required value={address.line1} onChange={set('line1')} className={field} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="line2" className={label}>
                  Address line 2 <span className="font-normal text-zinc-400">(optional)</span>
                </label>
                <input id="line2" value={address.line2} onChange={set('line2')} className={field} />
              </div>
              <div>
                <label htmlFor="city" className={label}>City</label>
                <input id="city" required value={address.city} onChange={set('city')} className={field} />
              </div>
              <div>
                <label htmlFor="state" className={label}>State</label>
                <input id="state" value={address.state} onChange={set('state')} className={field} />
              </div>
              <div>
                <label htmlFor="postalCode" className={label}>ZIP / Postal code</label>
                <input id="postalCode" required value={address.postalCode} onChange={set('postalCode')} className={field} />
              </div>
              <div>
                <label htmlFor="country" className={label}>Country</label>
                <input id="country" required value={address.country} onChange={set('country')} className={field} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="phone" className={label}>
                  Phone <span className="font-normal text-zinc-400">(optional)</span>
                </label>
                <input id="phone" type="tel" value={address.phone} onChange={set('phone')} className={field} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Payment method</h2>
            <div className="mt-4 space-y-2">
              {[
                { id: 'cod', title: 'Cash on delivery', desc: 'Pay when your order arrives', Icon: Banknote },
                { id: 'card', title: 'Card', desc: 'Payment gateway integration required', Icon: CreditCard },
              ].map(({ id, title, desc, Icon }) => (
                <label
                  key={id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                    paymentMethod === id
                      ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900'
                      : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={id}
                    checked={paymentMethod === id}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                  <Icon className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                  <span>
                    <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">{desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Summary */}
        <div className="h-fit rounded-2xl border border-zinc-200 bg-white p-6 lg:sticky lg:top-24 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Your order</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((i) => (
              <li key={i.product} className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-zinc-600 dark:text-zinc-400">
                  {i.name} <span className="text-zinc-400 dark:text-zinc-500">×{i.qty}</span>
                </span>
                <span className="whitespace-nowrap font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                  ${(i.price * i.qty).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2.5 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800">
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
          <Button type="submit" size="lg" className="mt-5" loading={checkoutStatus === 'loading'}>
            Place order
          </Button>
        </div>
      </form>
    </div>
  );
}
