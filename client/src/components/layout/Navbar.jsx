import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingBag, Menu, X, UserCircle2, Search, Sun, Moon, LogOut } from 'lucide-react';
import { logoutUser } from '../../features/auth/authSlice.js';
import { selectCartItemCount } from '../../features/cart/cartSlice.js';
import { openCartDrawer, toggleSearch, toggleTheme } from '../../features/ui/uiSlice.js';

const navLinks = [
  { to: '/', label: 'Shop', end: true },
  { to: '/orders', label: 'My Orders' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const cartCount = useSelector(selectCartItemCount);
  const theme = useSelector((s) => s.ui.theme);

  const handleLogout = async () => {
    setMobileOpen(false);
    await dispatch(logoutUser());
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? 'bg-zinc-900/5 text-zinc-900 dark:bg-zinc-50/10 dark:text-zinc-50'
        : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
    }`;

  return (
    <header className="glass sticky top-0 z-40 border-b border-zinc-200/70 dark:border-zinc-800/70">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-[17px] font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-50">
            <ShoppingBag className="h-4 w-4 text-zinc-50 dark:text-zinc-900" />
          </span>
          Shop<span className="text-zinc-500 dark:text-zinc-400">Swift</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-1.5 md:flex">
          {/* Search trigger — Cmd+K style */}
          <button
            onClick={() => dispatch(toggleSearch(true))}
            className="group flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/60 px-3 py-1.5 text-sm text-zinc-400 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-500 dark:hover:border-zinc-700"
          >
            <Search className="h-4 w-4" />
            <span className="hidden lg:inline">Search…</span>
            <kbd className="hidden rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500 lg:inline dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
              ⌘K
            </kbd>
          </button>

          <ThemeToggle theme={theme} />

          {user ? (
            <>
              <Link
                to="/profile"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-900/5 dark:text-zinc-300 dark:hover:bg-zinc-50/10"
              >
                <UserCircle2 className="h-5 w-5" />
                {user.name.split(' ')[0]}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-50/10 dark:hover:text-zinc-100"
                aria-label="Log out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-50 transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                Sign up
              </Link>
            </>
          )}

          <CartButton cartCount={cartCount} />
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-1 md:hidden">
          <button
            onClick={() => dispatch(toggleSearch(true))}
            className="rounded-lg p-2 text-zinc-600 transition hover:bg-zinc-900/5 dark:text-zinc-300 dark:hover:bg-zinc-50/10"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
          <ThemeToggle theme={theme} />
          <CartButton cartCount={cartCount} />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-zinc-700 transition hover:bg-zinc-900/5 dark:text-zinc-300 dark:hover:bg-zinc-50/10"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="glass border-t border-zinc-200/70 px-4 pb-4 pt-2 md:hidden dark:border-zinc-800/70">
          <div className="flex flex-col gap-1">
            {navLinks.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkClass} onClick={() => setMobileOpen(false)}>
                {l.label}
              </NavLink>
            ))}
            {user ? (
              <>
                <NavLink to="/profile" className={linkClass} onClick={() => setMobileOpen(false)}>
                  Profile
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-600 transition hover:bg-zinc-900/5 dark:text-zinc-400 dark:hover:bg-zinc-50/10"
                >
                  Log out
                </button>
              </>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-center text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-center text-sm font-semibold text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function ThemeToggle({ theme }) {
  const dispatch = useDispatch();
  return (
    <button
      onClick={() => dispatch(toggleTheme())}
      className="rounded-lg p-2 text-zinc-600 transition hover:bg-zinc-900/5 dark:text-zinc-300 dark:hover:bg-zinc-50/10"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

function CartButton({ cartCount }) {
  const dispatch = useDispatch();
  return (
    <button
      onClick={() => dispatch(openCartDrawer())}
      className="relative rounded-lg p-2 text-zinc-700 transition hover:bg-zinc-900/5 dark:text-zinc-300 dark:hover:bg-zinc-50/10"
      aria-label={`Open cart, ${cartCount} items`}
    >
      <ShoppingBag className="h-5 w-5" />
      {cartCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1 text-[10px] font-bold text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
          {cartCount > 9 ? '9+' : cartCount}
        </span>
      )}
    </button>
  );
}
