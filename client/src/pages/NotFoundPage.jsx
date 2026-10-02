import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
        <Compass className="h-6 w-6 text-zinc-400 dark:text-zinc-600" />
      </div>
      <p className="text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">404</p>
      <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        The page you are looking for doesn't exist or has moved.
      </p>
      <Link
        to="/"
        className="mt-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-zinc-50 transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Back to shop
      </Link>
    </div>
  );
}
