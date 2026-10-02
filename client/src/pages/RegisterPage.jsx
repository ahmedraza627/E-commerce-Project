import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { UserPlus } from 'lucide-react';
import { registerUser } from '../features/auth/authSlice.js';
import Button from '../components/ui/Button.jsx';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((s) => s.auth);

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [mismatch, setMismatch] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    const result = await dispatch(
      registerUser({ name: form.name, email: form.email, password: form.password })
    );
    if (registerUser.fulfilled.match(result)) {
      navigate('/', { replace: true });
    }
  };

  const field =
    'w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-50/10';
  const label = 'mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300';

  return (
    <div className="mx-auto max-w-md py-8 sm:py-14">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs sm:p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 dark:bg-zinc-50">
          <UserPlus className="h-5 w-5 text-zinc-50 dark:text-zinc-900" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Sign up to start shopping</p>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            {error}
          </p>
        )}
        {mismatch && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            Passwords do not match
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className={label}>Full name</label>
            <input
              id="name"
              type="text"
              required
              minLength={2}
              autoComplete="name"
              placeholder="Jane Appleseed"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={field}
            />
          </div>
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
              minLength={8}
              autoComplete="new-password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={field}
            />
            <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">
              Min 8 characters with upper, lower and a number
            </p>
          </div>
          <div>
            <label htmlFor="confirm" className={label}>Confirm password</label>
            <input
              id="confirm"
              type="password"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              className={field}
            />
          </div>
          <Button type="submit" size="lg" loading={status === 'loading'}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Already registered?{' '}
          <Link
            to="/login"
            className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition hover:decoration-zinc-900 dark:text-zinc-100 dark:decoration-zinc-700 dark:hover:decoration-zinc-50"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
