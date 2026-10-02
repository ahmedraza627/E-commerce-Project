import ProductCard from './ProductCard.jsx';

/** Mobile-first grid: 1 col → 2 → 3 → 4. */
export default function ProductGrid({ products, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="aspect-square animate-pulse bg-zinc-100 dark:bg-zinc-900" />
            <div className="space-y-2 p-4">
              <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
              <div className="h-4 w-1/4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        No products match your filters.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p._id} product={p} />
      ))}
    </div>
  );
}
