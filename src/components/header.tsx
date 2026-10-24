import Link from "next/link";
import { SearchBar } from "./search-bar";
import { ThemeToggle } from "./theme-toggle";
import { Bookmark, BookOpen } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-color)] bg-[var(--bg-main)]/95 backdrop-blur-none transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6 shrink-0">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 bg-[var(--accent)] rounded-none inline-block" />
            <span>Bilbili</span>
          </Link>
        </div>

        {/* Search bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <SearchBar />
        </div>

        {/* Navigation & actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="md:hidden">
            <SearchBar />
          </div>

          <Link
            href="/saved"
            className="w-9 h-9 flex items-center justify-center border border-[var(--border-color)] rounded bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
            aria-label="View saved articles and reading history"
            title="Saved and history"
          >
            <Bookmark className="w-4 h-4" />
          </Link>

          <ThemeToggle />

          <Link
            href="/admin"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[var(--border-color)] rounded bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Admin</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
