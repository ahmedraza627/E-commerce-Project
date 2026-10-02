import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Minus, Plus, ShoppingBag, ChevronLeft, Check } from 'lucide-react';
import { fetchProduct, clearCurrentProduct } from '../features/products/productsSlice.js';
import { quickAddToCart } from '../features/cart/cartSlice.js';
import { openCartDrawer } from '../features/ui/uiSlice.js';
import Button from '../components/ui/Button.jsx';

export default function ProductDetailPage() {
  const { idOrSlug } = useParams();
  const dispatch = useDispatch();
  const { current: product, detailStatus: status } = useSelector((s) => s.products);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const images = product?.images ?? [];
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    dispatch(fetchProduct(idOrSlug));
    setQty(1);
    setActiveImage(0);
    return () => dispatch(clearCurrentProduct());
  }, [dispatch, idOrSlug]);

  if (status === 'loading' || (!product && status === 'idle')) {
    return (
      <div className="grid animate-pulse gap-10 py-8 lg:grid-cols-2">
        <div className="aspect-square rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
        <div className="space-y-4">
          <div className="h-4 w-24 rounded bg-zinc-100 dark:bg-zinc-900" />
          <div className="h-9 w-3/4 rounded bg-zinc-100 dark:bg-zinc-900" />
          <div className="h-7 w-32 rounded bg-zinc-100 dark:bg-zinc-900" />
          <div className="h-20 w-full rounded bg-zinc-100 dark:bg-zinc-900" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Product not found</p>
        <Link
          to="/"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ChevronLeft className="h-4 w-4" /> Back to shop
        </Link>
      </div>
    );
  }

  const outOfStock = product.inStock === false;
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;

  const handleAdd = () => {
    dispatch(
      quickAddToCart({
        productId: product._id,
        qty,
        product: { name: product.name, slug: product.slug, images, price: product.price },
      })
    )
      .unwrap()
      .then(() => {
        setAdded(true);
        setTimeout(() => setAdded(false), 1600);
        dispatch(openCartDrawer()); // show the result immediately
      })
      .catch(() => {}); // error toast handled globally in the slice consumer? keep silent here
  };

  return (
    <div className="py-4">
      <nav className="mb-6 flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
        <Link to="/" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
          Shop
        </Link>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        <span className="capitalize text-zinc-900 dark:text-zinc-100">{product.category}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
            {images[activeImage] ? (
              <img
                src={images[activeImage]}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.04]"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ShoppingBag className="h-10 w-10 text-zinc-300 dark:text-zinc-700" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 overflow-hidden rounded-lg border transition ${
                    i === activeImage
                      ? 'border-zinc-900 dark:border-zinc-100'
                      : 'border-zinc-200 opacity-60 hover:opacity-100 dark:border-zinc-800'
                  }`}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            {product.brand}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            {product.name}
          </h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
              ${product.price?.toFixed(2)}
            </span>
            {discount > 0 && (
              <>
                <span className="text-lg tabular-nums text-zinc-400 line-through dark:text-zinc-500">
                  ${product.compareAtPrice?.toFixed(2)}
                </span>
                <span className="rounded-md bg-zinc-900 px-2 py-1 text-[11px] font-semibold text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
                  −{discount}%
                </span>
              </>
            )}
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-sm">
            <span className="text-amber-500">★</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{product.rating?.toFixed(1)}</span>
            <span className="text-zinc-500 dark:text-zinc-400">({product.numReviews} reviews)</span>
          </div>

          <p className="mt-6 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">{product.description}</p>

          <div className="mt-6 flex items-center gap-2 text-sm">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                outOfStock ? 'bg-red-500' : product.countInStock < 5 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
            <span className={outOfStock ? 'text-red-600 dark:text-red-400' : 'text-zinc-600 dark:text-zinc-300'}>
              {outOfStock
                ? 'Out of stock'
                : product.countInStock < 5
                  ? `Only ${product.countInStock} left`
                  : `In stock — ${product.countInStock} available`}
            </span>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="flex h-12 items-center rounded-lg border border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="flex h-full w-11 items-center justify-center text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-semibold tabular-nums dark:text-zinc-100">{qty}</span>
              <button
                onClick={() => setQty(Math.min(product.countInStock || 99, qty + 1))}
                className="flex h-full w-11 items-center justify-center text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <Button
              onClick={handleAdd}
              disabled={outOfStock}
              className="flex-1 sm:flex-none sm:min-w-48"
            >
              {added ? (
                <>
                  <Check className="h-4 w-4" /> Added to cart
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" /> Add to cart
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
