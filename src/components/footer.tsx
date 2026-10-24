import Link from "next/link";
import { Rss } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-[var(--border-color)] bg-[var(--bg-surface)] mt-24 py-10 text-sm text-[var(--text-secondary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-center sm:text-left">
          <span className="font-semibold text-[var(--text-primary)]">Bilbili</span>
          <span>A simple, text-first educational knowledge repository.</span>
        </div>

        <div className="flex items-center gap-5 text-xs">
          <Link href="/saved" className="hover:text-[var(--text-primary)] hover:underline">
            Saved Articles
          </Link>
          <Link href="/rss.xml" className="hover:text-[var(--text-primary)] hover:underline flex items-center gap-1">
            <Rss className="w-3 h-3" />
            <span>RSS Feed</span>
          </Link>
          <Link href="/admin" className="hover:text-[var(--text-primary)] hover:underline">
            Admin Portal
          </Link>
        </div>
      </div>
    </footer>
  );
}
