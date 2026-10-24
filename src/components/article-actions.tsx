"use client";

import { useState, useEffect } from "react";
import { Bookmark, Share2, ArrowUp, Check, Copy } from "lucide-react";
import type { Blog } from "@/types";

interface ArticleActionsProps {
  blog: Pick<Blog, "id" | "title" | "slug" | "excerpt" | "readingTime">;
}

export function ArticleActions({ blog }: ArticleActionsProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  // Load bookmark status & track recently viewed in localStorage
  useEffect(() => {
    try {
      const rawBookmarks = localStorage.getItem("bilbili_bookmarks");
      if (rawBookmarks) {
        const bookmarks: { id: string }[] = JSON.parse(rawBookmarks);
        setIsBookmarked(bookmarks.some((b) => b.id === blog.id));
      }

      // Add to recently viewed
      const rawRecent = localStorage.getItem("bilbili_recent");
      let recent: Array<{
        id: string;
        title: string;
        slug: string;
        readingTime: number;
        viewedAt: string;
      }> = rawRecent ? JSON.parse(rawRecent) : [];

      recent = recent.filter((r) => r.id !== blog.id);
      recent.unshift({
        id: blog.id,
        title: blog.title,
        slug: blog.slug,
        readingTime: blog.readingTime,
        viewedAt: new Date().toISOString(),
      });

      // Keep up to 30 recent articles
      localStorage.setItem("bilbili_recent", JSON.stringify(recent.slice(0, 30)));
    } catch {
      // Local storage disabled or full
    }
  }, [blog]);

  const toggleBookmark = () => {
    try {
      const rawBookmarks = localStorage.getItem("bilbili_bookmarks");
      let bookmarks: Array<{
        id: string;
        title: string;
        slug: string;
        readingTime: number;
        savedAt: string;
      }> = rawBookmarks ? JSON.parse(rawBookmarks) : [];

      if (isBookmarked) {
        bookmarks = bookmarks.filter((b) => b.id !== blog.id);
        setIsBookmarked(false);
      } else {
        bookmarks.unshift({
          id: blog.id,
          title: blog.title,
          slug: blog.slug,
          readingTime: blog.readingTime,
          savedAt: new Date().toISOString(),
        });
        setIsBookmarked(true);
      }
      localStorage.setItem("bilbili_bookmarks", JSON.stringify(bookmarks));
    } catch {
      // Ignore storage errors
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      setShareMenuOpen(!shareMenuOpen);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex items-center gap-2 py-4 border-y border-[var(--border-color)] my-8">
      {/* Bookmark */}
      <button
        type="button"
        onClick={toggleBookmark}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded transition-colors ${
          isBookmarked
            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
            : "border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--accent)]"
        }`}
        aria-label={isBookmarked ? "Remove bookmark" : "Bookmark article"}
      >
        <Bookmark className="w-3.5 h-3.5" fill={isBookmarked ? "currentColor" : "none"} />
        <span>{isBookmarked ? "Saved" : "Save"}</span>
      </button>

      {/* Copy link */}
      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded hover:border-[var(--accent)] transition-colors"
        aria-label="Copy article link"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            <span>Link Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Link</span>
          </>
        )}
      </button>

      {/* Share */}
      <button
        type="button"
        onClick={handleNativeShare}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded hover:border-[var(--accent)] transition-colors"
        aria-label="Share article"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span>Share</span>
      </button>

      {/* Back to top */}
      <button
        type="button"
        onClick={scrollToTop}
        className="ml-auto inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] rounded hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
        aria-label="Scroll back to top"
      >
        <ArrowUp className="w-3.5 h-3.5" />
        <span>Top</span>
      </button>
    </div>
  );
}
