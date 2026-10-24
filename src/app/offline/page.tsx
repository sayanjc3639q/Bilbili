import Link from "next/link";
import { WifiOff, Bookmark } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="reading-column py-16 text-center">
      <div className="w-12 h-12 mx-auto mb-4 border border-[var(--border-color)] bg-[var(--bg-surface)] rounded flex items-center justify-center text-[var(--text-secondary)]">
        <WifiOff className="w-6 h-6" />
      </div>

      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
        You are currently offline
      </h1>
      <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-6">
        An active network connection is required to fetch new articles. However, articles saved to your device library remain accessible.
      </p>

      <Link
        href="/saved"
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] transition-colors"
      >
        <Bookmark className="w-4 h-4" />
        <span>Open Saved Articles</span>
      </Link>
    </div>
  );
}
