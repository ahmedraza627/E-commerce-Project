import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Check } from 'lucide-react';
import { quickAddToCart, selectCartStatus } from '../../features/cart/cartSlice.js';
import { pushToast } from '../../features/ui/uiSlice.js';

/**
 * Product card — Linear/Vercel aesthetic:
 * - Hairline border, soft shadow on hover, image zoom + second-image cross-fade
 * - Discount tag as a floating chip, "Quick add" pill appearing on hover
 * - Optimistic add: instant ✓ feedback, rolled back with a toast if the API fails
 */
export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartStatus = useSelector(selectCartStatus);
  const [added, setAdded] = useState(false); // transient ✓ feedback
  const images = product.images ?? [];
  const hasAlt = images.length > 1;
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;
  const outOfStock = product.inStock === false;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;

    dispatch(
      quickAddToCart({
        productId: product._id,
        qty: 1,
        product: { name: product.name, slug: product.slug, images, price: product.price },
      })
    )
      .unwrap()
      .then(() => {
        setAdded(true);
        setTimeout(() => setAdded(false), 1600);
      })
      .catch((err) => {
        // Rejected payload is { error, prevItems, productId } from the slice;
        // superseded ops resolve (never reject), so we only surface real errors.
        const message = err?.error?.message ?? err?.message ?? 'Could not add to cart';
        dispatch(pushToast(message, 'error'));
      });
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all duration-300 hover:border-zinc-300 hover:shadow-pop dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
      {/* Media */}
      <Link to={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        {images[0] ? (
          <>
            <img
              src={images[0]}
              alt={product.name}
              loading="lazy"
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.06] ${
                hasAlt ? 'group-hover:opacity-0' : ''
              }`}
            />
            {hasAlt && (
              <img
                src={images[1]}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="absolute inset-0 h-full w-full scale-[1.06] object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Plus className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
          </div>
        )}

        {/* Discount chip */}
        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-md bg-zinc-900 px-2 py-1 text-[11px] font-semibold tracking-wide text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
            −{discount}%
          </span>
        )}
        {outOfStock && (
          <span className="absolute inset-x-0 bottom-0 bg-zinc-950/70 py-2 text-center text-xs font-medium text-zinc-100 backdrop-blur-sm">
            Out of stock
          </span>
        )}

        {/* Quick add — fades up on hover (always visible on touch: focus-within) */}
        {!outOfStock && (
          <button
            onClick={handleQuickAdd}
            className={`absolute bottom-3 right-3 inline-flex h-10 items-center gap-1.5 rounded-lg px-3.5 text-sm font-medium shadow-pop transition-all duration-300 focus-visible:opacity-100 ${
              added
                ? 'bg-emerald-600 text-white opacity-100'
                : 'translate-y-1.5 bg-zinc-900 text-zinc-50 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 dark:bg-zinc-50 dark:text-zinc-900'
            }`}
            aria-label={`Add ${product.name} to cart`}
          >
            {added ? (
              <>
                <Check className="h-4 w-4" /> Added
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Quick add
              </>
            )}
          </button>
        )}
      </Link>

      {/* Meta */}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          {product.brand ?? product.category}
        </p>
        <Link
          to={`/products/${product.slug}`}
          className="line-clamp-2 text-sm font-medium leading-snug text-zinc-900 transition group-hover:underline decoration-zinc-300 underline-offset-4 dark:text-zinc-100 dark:decoration-zinc-700"
        >
          {product.name}
        </Link>
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-[15px] font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            ${product.price?.toFixed(2)}
          </span>
          {discount > 0 && (
            <span className="text-sm tabular-nums text-zinc-400 line-through dark:text-zinc-500">
              ${product.compareAtPrice?.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
