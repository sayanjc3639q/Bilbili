import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="reading-column py-16 text-center">
      <div className="inline-block px-3 py-1 border border-[var(--border-color)] rounded bg-[var(--bg-surface)] text-xs font-mono text-[var(--text-secondary)] mb-4">
        HTTP 404
      </div>
      <h1 className="text-3xl font-extrabold text-[var(--text-primary)] mb-3">
        Article or Topic Not Found
      </h1>
      <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-8 leading-relaxed">
        The requested resource may have been relocated, deleted, or the identifier is invalid.
      </p>

      <div className="flex items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded hover:border-[var(--accent)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Homepage</span>
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          <span>Search Archive</span>
        </Link>
      </div>
    </div>
  );
}
