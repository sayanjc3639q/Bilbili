"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, CornerDownLeft, X } from "lucide-react";
import { searchCompactIndex, highlightMatchSegments } from "@/lib/search";
import type { SearchIndexItem } from "@/types";

export function SearchBar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [indexData, setIndexData] = useState<SearchIndexItem[] | null>(null);
  const [loadingIndex, setLoadingIndex] = useState(false);
  const [results, setResults] = useState<{ item: SearchIndexItem; score: number }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Fetch index on mount or when focused/typed
  const fetchIndex = useCallback(async () => {
    if (indexData !== null || loadingIndex) return;
    setLoadingIndex(true);
    try {
      const res = await fetch("/api/search-index");
      if (res.ok) {
        const data = await res.json();
        setIndexData(data);
      }
    } catch {
      setIndexData([]);
    } finally {
      setLoadingIndex(false);
    }
  }, [indexData, loadingIndex]);

  // Preload search index on component mount so search is instant
  useEffect(() => {
    fetchIndex();
  }, [fetchIndex]);

  // Global '/' keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 150ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  // Perform local search when debouncedQuery or index changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    if (indexData) {
      const matched = searchCompactIndex(debouncedQuery, indexData, 8);
      setResults(matched);
      setSelectedIndex(-1);
      setIsOpen(true);
    }
  }, [debouncedQuery, indexData]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        router.push(`/blog/${results[selectedIndex].item.slug}`);
        setIsOpen(false);
        inputRef.current?.blur();
      } else if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        setIsOpen(false);
        inputRef.current?.blur();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const clearQuery = () => {
    setQuery("");
    setDebouncedQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="search-suggestions-list"
          value={query}
          onFocus={() => {
            fetchIndex();
            if (query.trim().length > 0) setIsOpen(true);
          }}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            if (val.trim().length > 0) {
              setIsOpen(true);
              fetchIndex();
            } else {
              setIsOpen(false);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search articles... (Press /)"
          className="w-full h-10 pl-9 pr-14 text-sm bg-[var(--bg-surface)] border border-[var(--border-color)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] transition-colors"
        />

        <div className="absolute right-2.5 flex items-center gap-1 pointer-events-none">
          {query ? (
            <button
              type="button"
              onClick={clearQuery}
              className="pointer-events-auto p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[11px] font-mono border border-[var(--border-color)] rounded text-[var(--text-secondary)] bg-[var(--bg-main)]">
              /
            </kbd>
          )}
        </div>
      </div>

      {isOpen && query.trim().length > 0 && (
        <div
          id="search-suggestions-list"
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1.5 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded shadow-none overflow-hidden max-h-96 overflow-y-auto"
        >
          {results.length > 0 ? (
            <ul className="divide-y divide-[var(--border-color)]">
              {results.map(({ item }, index) => {
                const isSelected = index === selectedIndex;
                const pathText = item.topicPathNames?.length
                  ? item.topicPathNames.join(" > ")
                  : item.subtopicId;

                return (
                  <li
                    key={item.id}
                    role="option"
                    aria-selected={isSelected}
                    className={`p-3 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[var(--border-color)] text-[var(--text-primary)]"
                        : "hover:bg-[var(--bg-main)]"
                    }`}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => {
                      router.push(`/blog/${item.slug}`);
                      setIsOpen(false);
                    }}
                  >
                    <div className="text-xs text-[var(--text-secondary)] mb-0.5 truncate">
                      {pathText}
                    </div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">
                      {highlightMatchSegments(item.title, query).map((seg, i) => (
                        <span
                          key={i}
                          className={seg.isMatch ? "bg-[#FEF3C7] dark:bg-[#57410A] font-semibold" : ""}
                        >
                          {seg.text}
                        </span>
                      ))}
                    </div>
                    {item.excerpt && (
                      <div className="text-xs text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                        {item.excerpt}
                      </div>
                    )}
                  </li>
                );
              })}
              <li className="p-2.5 bg-[var(--bg-main)] text-xs text-[var(--text-secondary)] flex items-center justify-between border-t border-[var(--border-color)]">
                <span>Use arrows to navigate</span>
                <Link
                  href={`/search?q=${encodeURIComponent(query.trim())}`}
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-1 font-medium text-[var(--accent)] hover:underline"
                >
                  View all results <CornerDownLeft className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-[var(--text-secondary)]">
              No matching articles found.
              <div className="mt-2">
                <Link
                  href={`/search?q=${encodeURIComponent(query.trim())}`}
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-[var(--accent)] hover:underline"
                >
                  Search all content for &quot;{query}&quot;
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
