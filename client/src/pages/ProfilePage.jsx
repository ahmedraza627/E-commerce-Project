import { useSelector } from 'react-redux';
import { ShieldCheck } from 'lucide-react';

/** Profile overview — session info plus pointers to account endpoints. */
export default function ProfilePage() {
  const { user } = useSelector((s) => s.auth);

  return (
    <div className="mx-auto max-w-2xl py-2">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">My profile</h1>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-xl font-bold text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{user?.name}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{user?.email}</p>
            <span className="mt-1 inline-block rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] font-medium capitalize text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
              {user?.role}
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-2.5 border-t border-zinc-100 pt-4 text-sm text-zinc-500 dark:border-zinc-800/60 dark:text-zinc-400">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          <p>
            Your session is protected with rotating HTTP-only cookies. Account settings (address
            book, password) map to the <code className="font-mono text-xs">/api/v1/users/me</code>{' '}
            endpoints.
          </p>
        </div>
      </div>
    </div>
  );
}
