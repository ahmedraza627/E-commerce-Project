import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LogIn } from 'lucide-react';
import { loginUser } from '../features/auth/authSlice.js';
import Button from '../components/ui/Button.jsx';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error } = useSelector((s) => s.auth);

  const [form, setForm] = useState({ email: '', password: '' });

  const onSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(result)) {
      navigate(location.state?.from ?? '/', { replace: true });
    }
  };

  const field =
    'w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-50/10';
  const label = 'mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300';

  return (
    <div className="mx-auto max-w-md py-8 sm:py-14">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs sm:p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 dark:bg-zinc-50">
          <LogIn className="h-5 w-5 text-zinc-50 dark:text-zinc-900" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Log in to your ShopSwift account
        </p>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            {error}
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className={label}>Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={field}
            />
          </div>
          <div>
            <label htmlFor="password" className={label}>Password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={field}
            />
          </div>
          <Button type="submit" size="lg" loading={status === 'loading'}>
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No account?{' '}
          <Link
            to="/register"
            className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition hover:decoration-zinc-900 dark:text-zinc-100 dark:decoration-zinc-700 dark:hover:decoration-zinc-50"
          >
            Create one
          </Link>
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-zinc-300 p-4 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        Demo: <code className="font-mono text-zinc-700 dark:text-zinc-300">demo@shopswift.dev / Demo123!</code>
      </div>
    </div>
  );
}
