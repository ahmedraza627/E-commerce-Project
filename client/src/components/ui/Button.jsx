import { Loader2 } from 'lucide-react';

/** Design-system button — zinc invert style, loading state, consistent focus ring. */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.99] dark:focus-visible:ring-zinc-50/30 dark:focus-visible:ring-offset-zinc-950';
  const variants = {
    primary:
      'bg-zinc-900 text-zinc-50 hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300',
    secondary:
      'border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost:
      'text-zinc-600 hover:bg-zinc-900/5 dark:text-zinc-400 dark:hover:bg-zinc-50/10',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'w-full px-4 py-3 text-[15px]',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
