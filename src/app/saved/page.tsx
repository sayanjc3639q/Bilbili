"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Clock, Trash2, ArrowRight } from "lucide-react";

interface SavedArticle {
  id: string;
  title: string;
  slug: string;
  readingTime: number;
  savedAt?: string;
  viewedAt?: string;
}

export default function SavedPage() {
  const [bookmarks, setBookmarks] = useState<SavedArticle[]>([]);
  const [recent, setRecent] = useState<SavedArticle[]>([]);
  const [activeTab, setActiveTab] = useState<"bookmarks" | "recent">("bookmarks");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const bData = localStorage.getItem("bilbili_bookmarks");
      if (bData) setBookmarks(JSON.parse(bData));

      const rData = localStorage.getItem("bilbili_recent");
      if (rData) setRecent(JSON.parse(rData));
    } catch {
      // Ignore
    }
  }, []);

  const removeBookmark = (id: string) => {
    const updated = bookmarks.filter((b) => b.id !== id);
    setBookmarks(updated);
    localStorage.setItem("bilbili_bookmarks", JSON.stringify(updated));
  };

  const clearRecent = () => {
    setRecent([]);
    localStorage.removeItem("bilbili_recent");
  };

  if (!mounted) {
    return (
      <div className="reading-column py-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Saved Articles</h1>
        <div className="h-32 bg-[var(--bg-surface)] animate-pulse rounded border border-[var(--border-color)]" />
      </div>
    );
  }

  return (
    <div className="reading-column py-6">
      <div className="pb-4 border-b border-[var(--border-color)] mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Reading Library
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Your bookmarked notes and local reading history (stored privately on this device).
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-[var(--border-color)] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("bookmarks")}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
            activeTab === "bookmarks"
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Saved ({bookmarks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("recent")}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
            activeTab === "recent"
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Recently Viewed ({recent.length})</span>
        </button>

        {activeTab === "recent" && recent.length > 0 && (
          <button
            type="button"
            onClick={clearRecent}
            className="ml-auto text-xs text-[var(--text-secondary)] hover:text-red-600 flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Bookmarks List */}
      {activeTab === "bookmarks" && (
        <div>
          {bookmarks.length === 0 ? (
            <div className="p-8 text-center border border-[var(--border-color)] rounded bg-[var(--bg-surface)] text-[var(--text-secondary)]">
              <p className="text-sm">You haven&apos;t saved any articles yet.</p>
              <p className="text-xs mt-1">
                Click the &quot;Save&quot; button while reading an article to bookmark it for later.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-[var(--accent)] hover:underline"
              >
                <span>Browse curriculum</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-color)] border-y border-[var(--border-color)]">
              {bookmarks.map((item) => (
                <div
                  key={item.id}
                  className="py-4 flex items-center justify-between gap-4 group"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/blog/${item.slug}`}
                      className="font-semibold text-base text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors hover:underline"
                    >
                      {item.title}
                    </Link>
                    <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {item.readingTime} min read
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeBookmark(item.id)}
                    className="p-2 text-[var(--text-secondary)] hover:text-red-600 shrink-0"
                    aria-label={`Remove ${item.title} from bookmarks`}
                    title="Remove from saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent History List */}
      {activeTab === "recent" && (
        <div>
          {recent.length === 0 ? (
            <div className="p-8 text-center border border-[var(--border-color)] rounded bg-[var(--bg-surface)] text-[var(--text-secondary)]">
              <p className="text-sm">No recent reading history found.</p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-[var(--accent)] hover:underline"
              >
                <span>Explore articles</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-color)] border-y border-[var(--border-color)]">
              {recent.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/blog/${item.slug}`}
                      className="font-medium text-sm text-[var(--text-primary)] hover:text-[var(--accent)] hover:underline truncate block"
                    >
                      {item.title}
                    </Link>
                    <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {item.readingTime} min read
                      {item.viewedAt && (
                        <span>
                          {" "}
                          • Viewed {new Date(item.viewedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
