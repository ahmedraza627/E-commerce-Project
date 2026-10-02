import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import useFocusTrap from '../../hooks/useFocusTrap.js';
import { Search, X, CornerDownLeft, Package } from 'lucide-react';
import { closeSearch, selectSearchOpen } from '../../features/ui/uiSlice.js';
import { productApi } from '../../api/endpoints.js';

/**
 * Instant search overlay — opens with Cmd/Ctrl+K or the navbar button.
 * Debounced live queries against /products?search= with thumbnail results.
 */
export default function SearchOverlay() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const open = useSelector(selectSearchOpen);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Focus input on open, reset state on close
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      const t = setTimeout(() => {
        setQuery('');
        setResults([]);
        setActiveIndex(0);
      }, 150);
      return () => clearTimeout(t);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Focus trap: Tab cycles inside the panel, Esc closes, focus restores to trigger.
  const trapRef = useFocusTrap({
    active: open,
    onClose: useCallback(() => dispatch(closeSearch()), [dispatch]),
  });

  // Debounced search with request cancellation — a newer keystroke aborts
  // the in-flight request so a slow stale response can never win the race.
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      abortRef.current?.abort();
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const data = await productApi.list({ search: q, limit: 6 }, controller.signal);
        setResults(data.items ?? []);
        setActiveIndex(0);
      } catch {
        setResults([]);
      } finally {
        if (abortRef.current === controller) {
          setLoading(false);
        }
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, open]);

  if (!open) return null;

  const close = () => dispatch(closeSearch());

  const goTo = (slug) => {
    close();
    navigate(`/products/${slug}`);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      goTo(results[activeIndex].slug);
    }
  };

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Search products" ref={trapRef} tabIndex={-1}>
      {/* Backdrop */}
      <div onClick={close} className="absolute inset-0 animate-fade-in bg-zinc-950/50 backdrop-blur-[2px]" />

      {/* Panel */}
      <div className="absolute inset-x-4 top-[12vh] mx-auto max-w-xl animate-scale-in overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-overlay dark:border-zinc-800 dark:bg-zinc-950">
        {/* Input row */}
        <div className="flex items-center gap-3 border-b border-zinc-200 px-4 dark:border-zinc-800">
          <Search className="h-5 w-5 shrink-0 text-zinc-400 dark:text-zinc-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search products…"
            className="flex-1 bg-transparent py-4 text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          <button
            onClick={close}
            className="rounded-md border border-zinc-200 p-1 text-zinc-400 transition hover:text-zinc-700 dark:border-zinc-800 dark:hover:text-zinc-200"
            aria-label="Close search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {query.trim().length < 2 ? (
            <p className="px-3 py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
              Type at least 2 characters to search…
            </p>
          ) : loading ? (
            <div className="space-y-1 p-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
                  <div className="h-10 w-10 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-900" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
              No results for “{query.trim()}”
            </p>
          ) : (
            <ul>
              {results.map((p, i) => (
                <li key={p._id}>
                  <button
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => goTo(p.slug)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                      i === activeIndex
                        ? 'bg-zinc-100 dark:bg-zinc-900'
                        : ''
                    }`}
                  >
                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full items-center justify-center">
                          <Package className="h-4 w-4 text-zinc-300 dark:text-zinc-700" />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {p.name}
                      </span>
                      <span className="block text-xs capitalize text-zinc-400 dark:text-zinc-500">
                        {p.category}
                      </span>
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                      ${p.price?.toFixed(2)}
                    </span>
                    {i === activeIndex && (
                      <CornerDownLeft className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 border-t border-zinc-200 px-4 py-2.5 text-[11px] text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-zinc-200 px-1 font-semibold dark:border-zinc-800">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-zinc-200 px-1 font-semibold dark:border-zinc-800">↵</kbd>
            open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-zinc-200 px-1 font-semibold dark:border-zinc-800">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}
