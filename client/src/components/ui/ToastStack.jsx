import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import { dismissToast } from '../../features/ui/uiSlice.js';

function Toast({ toast }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setTimeout(() => dispatch(dismissToast(toast.id)), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, dispatch]);

  const isError = toast.tone === 'error';

  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-3.5 shadow-pop backdrop-blur-md animate-slide-up-fade ${
        isError
          ? 'border-red-200 bg-red-50/90 text-red-800 dark:border-red-900/60 dark:bg-red-950/80 dark:text-red-300'
          : 'border-zinc-200 bg-white/90 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-200'
      }`}
    >
      {isError ? (
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500 dark:text-red-400" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500 dark:text-emerald-400" />
      )}
      <p className="flex-1 text-sm">{toast.message}</p>
      <button
        onClick={() => dispatch(dismissToast(toast.id))}
        className="rounded-md p-1 transition hover:bg-black/5 dark:hover:bg-white/10"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/** Fixed toast stack — bottom-center on mobile, top-right on larger screens. */
export default function ToastStack() {
  const toasts = useSelector((s) => s.ui.toasts);

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:top-6 sm:items-end">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}
    </div>
  );
}
