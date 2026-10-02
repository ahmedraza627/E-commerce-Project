import { useDispatch, useSelector } from 'react-redux';
import { ChevronDown } from 'lucide-react';
import { setFilter } from '../../features/products/productsSlice.js';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'bestselling', label: 'Best Selling' },
];

/** One collapsible facet — native <details> keeps it zero-layout-shift and accessible. */
function Facet({ title, children, defaultOpen = true }) {
  return (
    <details open={defaultOpen} className="group border-b border-zinc-200 pb-4 dark:border-zinc-800">
      <summary className="flex cursor-pointer select-none items-center justify-between py-1 text-sm font-semibold text-zinc-900 marker:content-none dark:text-zinc-100 [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-4 w-4 text-zinc-400 transition-transform duration-200 group-open:rotate-180 dark:text-zinc-500" />
      </summary>
      <div className="pt-3">{children}</div>
    </details>
  );
}

/**
 * Faceted filters — collapsible sections (sort, category, price, availability).
 * Native <details> elements mean no measured height animations and no layout shift.
 */
export default function FilterSidebar() {
  const dispatch = useDispatch();
  const { filters, categories } = useSelector((s) => s.products);

  const update = (patch) => dispatch(setFilter(patch));

  const inputClass =
    'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600 dark:focus:ring-zinc-50/10';

  return (
    <aside className="space-y-4">
      <Facet title="Sort by">
        <div className="space-y-1.5">
          {SORT_OPTIONS.map((o) => (
            <label key={o.value} className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-600 dark:text-zinc-400">
              <input
                type="radio"
                name="sort"
                checked={filters.sort === o.value}
                onChange={() => update({ sort: o.value })}
                className="h-3.5 w-3.5 border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
              {o.label}
            </label>
          ))}
        </div>
      </Facet>

      <Facet title="Category">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => update({ category: '' })}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              filters.category === ''
                ? 'border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700'
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => update({ category: c })}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition ${
                filters.category === c
                  ? 'border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                  : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </Facet>

      <Facet title="Price range">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => update({ minPrice: e.target.value })}
            className={inputClass}
            aria-label="Minimum price"
          />
          <span className="text-zinc-300 dark:text-zinc-700">–</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => update({ maxPrice: e.target.value })}
            className={inputClass}
            aria-label="Maximum price"
          />
        </div>
      </Facet>

      <Facet title="Availability" defaultOpen={false}>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => update({ inStock: e.target.checked })}
            className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          In stock only
        </label>
      </Facet>
    </aside>
  );
}
