import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, X, Sparkles } from 'lucide-react';
import {
  fetchProducts,
  fetchCategories,
  setFilter,
  setPage,
} from '../features/products/productsSlice.js';
import ProductGrid from '../components/product/ProductGrid.jsx';
import FilterSidebar from '../components/product/FilterSidebar.jsx';

export default function HomePage() {
  const dispatch = useDispatch();
  const { items, status, filters, pagination, categories } = useSelector((s) => s.products);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [
    dispatch,
    filters.search,
    filters.category,
    filters.sort,
    filters.minPrice,
    filters.maxPrice,
    filters.inStock,
    pagination.page,
  ]);

  useEffect(() => {
    if (!categories.length) dispatch(fetchCategories());
  }, [dispatch, categories.length]);

  const search = (e) => {
    e.preventDefault();
    dispatch(setFilter({ search: e.currentTarget.elements.q.value }));
  };

  const pages = Array.from({ length: pagination.pages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pagination.pages || Math.abs(p - pagination.page) <= 1
  );

  return (
    <div className="space-y-8">
      {/* Hero — quiet confidence: big type, hairline frame, one CTA */}
      <section className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white px-6 py-12 sm:px-10 sm:py-16 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-zinc-100 blur-3xl dark:bg-zinc-800/60"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <Sparkles className="h-3.5 w-3.5" />
            New season, new gear
          </span>
          <h1 className="mt-4 max-w-2xl text-3xl font-extrabold leading-[1.1] tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
            Objects of daily obsession.
            <span className="block text-zinc-400 dark:text-zinc-500">Delivered in 48 hours.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-500 sm:text-base dark:text-zinc-400">
            Free shipping over $75 · 30-day returns · Carbon-neutral delivery
          </p>

          <form onSubmit={search} className="mt-7 flex max-w-md items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                name="q"
                type="search"
                placeholder="Search the catalog…"
                className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600 dark:focus:ring-zinc-50/10"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-50 transition hover:bg-zinc-700 active:scale-[0.99] dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Search
            </button>
          </form>

          {filters.search && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 py-1 pl-3 pr-1 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              Results for “{filters.search}”
              <button
                onClick={() => dispatch(setFilter({ search: '' }))}
                className="rounded-full p-1 transition hover:bg-zinc-200 dark:hover:bg-zinc-800"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Filters: stacked on mobile, sticky sidebar on desktop */}
        <div className="lg:w-60 lg:shrink-0">
          <FilterSidebar />
        </div>

        <div className="flex-1 space-y-6">
          <ProductGrid products={items} loading={status === 'loading'} />

          {pagination.pages > 1 && (
            <nav className="flex flex-wrap items-center justify-center gap-1.5" aria-label="Pagination">
              {pages.map((p) => (
                <button
                  key={p}
                  onClick={() => dispatch(setPage(p))}
                  className={`min-w-10 rounded-lg border px-3 py-2 text-sm font-medium tabular-nums transition ${
                    p === pagination.page
                      ? 'border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                      : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
