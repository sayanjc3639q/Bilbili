"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Calendar, ArrowRight, Loader2 } from "lucide-react";
import type { Blog } from "@/types";
import { cleanPreviewText } from "@/lib/text-utils";

interface LatestBlogsListProps {
  initialBlogs: Blog[];
  initialCursor?: string;
}

export function LatestBlogsList({ initialBlogs, initialCursor }: LatestBlogsListProps) {
  const [blogs, setBlogs] = useState<Blog[]>(initialBlogs);
  const [cursor, setCursor] = useState<string | undefined>(initialCursor);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (!cursor || loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/blogs?cursor=${encodeURIComponent(cursor)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setBlogs((prev) => [...prev, ...data.blogs]);
        setCursor(data.nextCursor);
      }
    } catch {
      // Handle network error
    } finally {
      setLoading(false);
    }
  };

  if (blogs.length === 0) {
    return (
      <div className="p-8 text-center border border-[var(--border-color)] rounded bg-[var(--bg-surface)] text-[var(--text-secondary)]">
        No published articles yet. Check back soon or browse the curriculum topics.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="divide-y divide-[var(--border-color)]">
        {blogs.map((blog) => (
          <article key={blog.id} className="py-6 first:pt-0 group">
            <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] mb-1.5">
              {blog.publishedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <time dateTime={blog.publishedAt}>
                    {new Date(blog.publishedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </span>
              )}
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{blog.readingTime} min read</span>
              </span>
            </div>

            <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
              <Link href={`/blog/${blog.slug}`}>{blog.title}</Link>
            </h3>

            {blog.excerpt && (
              <p className="mt-2 text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                {cleanPreviewText(blog.excerpt)}
              </p>
            )}

            {blog.tags && blog.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {blog.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] px-2 py-0.5 border border-[var(--border-color)] rounded bg-[var(--bg-surface)] text-[var(--text-secondary)] font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      {cursor && (
        <div className="pt-4 text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-[var(--border-color)] rounded bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading more...</span>
              </>
            ) : (
              <>
                <span>Load More Articles</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
