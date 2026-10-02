export default function Footer() {
  return (
    <footer className="border-t border-zinc-200/70 dark:border-zinc-800/70">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-zinc-500 sm:flex-row sm:px-6 lg:px-8 dark:text-zinc-400">
        <p>© {new Date().getFullYear()} ShopSwift. All rights reserved.</p>
        <p className="flex items-center gap-1.5">
          Built with
          <span className="font-medium text-zinc-700 dark:text-zinc-300">MERN</span>·
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Redux Toolkit</span>·
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Tailwind</span>
        </p>
      </div>
    </footer>
  );
}
