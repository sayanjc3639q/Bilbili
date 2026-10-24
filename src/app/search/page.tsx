"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Search, Clock, Calendar, ArrowRight, BookOpen } from "lucide-react";
import { searchCompactIndex, highlightMatchSegments } from "@/lib/search";
import type { SearchIndexItem } from "@/types";
import { cleanPreviewText } from "@/lib/text-utils";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="reading-column py-8">
          <div className="h-20 bg-[var(--bg-surface)] animate-pulse rounded border border-[var(--border-color)]" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [index, setIndex] = useState<SearchIndexItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<{ item: SearchIndexItem; score: number }[]>([]);

  useEffect(() => {
    async function loadIndex() {
      try {
        const res = await fetch("/api/search-index");
        if (res.ok) {
          const data: SearchIndexItem[] = await res.json();
          setIndex(data);
          if (query) {
            setResults(searchCompactIndex(query, data, 50));
          }
        }
      } catch {
        setIndex([]);
      } finally {
        setLoading(false);
      }
    }
    loadIndex();
  }, [query]);

  return (
    <div className="reading-column py-6">
      <div className="pb-4 border-b border-[var(--border-color)] mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Search Results
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {query ? (
            <>
              Found {results.length} {results.length === 1 ? "article" : "articles"} matching{" "}
              <span className="font-semibold text-[var(--text-primary)]">&quot;{query}&quot;</span>
            </>
          ) : (
            "Enter a search query in the header or browse suggested topics below."
          )}
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 bg-[var(--bg-surface)] animate-pulse rounded border border-[var(--border-color)]"
            />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="divide-y divide-[var(--border-color)] border-y border-[var(--border-color)]">
          {results.map(({ item }) => (
            <article key={item.id} className="py-6 group">
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-1">
                <span className="truncate">
                  {item.topicPathNames?.join(" > ") || item.subtopicId}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{item.readingTime} min</span>
                </span>
              </div>

              <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                <Link href={`/blog/${item.slug}`}>
                  {highlightMatchSegments(item.title, query).map((seg, i) => (
                    <span
                      key={i}
                      className={
                        seg.isMatch
                          ? "bg-[#FEF3C7] dark:bg-[#57410A] font-semibold"
                          : ""
                      }
                    >
                      {seg.text}
                    </span>
                  ))}
                </Link>
              </h2>

              {item.excerpt && (
                <p className="mt-2 text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                  {highlightMatchSegments(cleanPreviewText(item.excerpt), query).map((seg, i) => (
                    <span
                      key={i}
                      className={
                        seg.isMatch
                          ? "bg-[#FEF3C7] dark:bg-[#57410A] font-semibold"
                          : ""
                      }
                    >
                      {seg.text}
                    </span>
                  ))}
                </p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center border border-[var(--border-color)] rounded bg-[var(--bg-surface)] text-[var(--text-secondary)]">
          <p className="font-semibold text-base text-[var(--text-primary)] mb-2">
            No matching articles found
          </p>
          <p className="text-sm max-w-md mx-auto mb-6">
            We couldn&apos;t find any publications matching your query. Try searching for broader technical terms or explore core topics.
          </p>

          <div className="text-left max-w-sm mx-auto p-4 border border-[var(--border-color)] rounded bg-[var(--bg-main)]">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Suggested Areas</span>
            </div>
            <ul className="text-xs space-y-2 text-[var(--accent)]">
              <li>
                <Link href="/topic/electrical-engineering" className="hover:underline flex items-center justify-between">
                  <span>Electrical Engineering</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </li>
              <li>
                <Link href="/topic/electric-field-theory" className="hover:underline flex items-center justify-between">
                  <span>Electric Field Theory</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </li>
              <li>
                <Link href="/topic/computer-science" className="hover:underline flex items-center justify-between">
                  <span>Computer Science & Algorithms</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
