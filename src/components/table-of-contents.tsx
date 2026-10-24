"use client";

import { useEffect, useState } from "react";
import { List } from "lucide-react";
import type { TableOfContentsItem } from "@/types";

interface TableOfContentsProps {
  items: TableOfContentsItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [readingProgress, setReadingProgress] = useState<number>(0);

  // Scroll spy & reading progress
  useEffect(() => {
    const handleScroll = () => {
      // Progress calculation
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setReadingProgress(Math.min(100, Math.max(0, currentProgress)));
      }

      // Scroll spy heading detection
      const headings = items
        .map((item) => document.getElementById(item.id))
        .filter(Boolean) as HTMLElement[];

      const scrollPosition = window.scrollY + 120;
      let currentActive = "";

      for (const heading of headings) {
        if (heading.offsetTop <= scrollPosition) {
          currentActive = heading.id;
        } else {
          break;
        }
      }

      if (currentActive) {
        setActiveId(currentActive);
      } else if (items.length > 0) {
        setActiveId(items[0].id);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [items]);

  if (items.length === 0) {
    return null;
  }

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      {/* Thin reading progress bar fixed to top */}
      <div
        className="reading-progress fixed top-0 left-0 right-0 h-[2.5px] bg-transparent z-50 pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="h-full bg-[var(--accent)] transition-all duration-75 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Desktop Sticky Table of Contents (220px) */}
      <aside
        className="hidden lg:block w-[220px] shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pl-4 border-l border-[var(--border-color)]"
        aria-label="Table of contents"
      >
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3 flex items-center gap-1.5">
          <List className="w-3.5 h-3.5" />
          <span>Contents</span>
        </div>
        <nav className="text-xs space-y-2">
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToHeading(item.id)}
                className={`block text-left w-full truncate py-1 transition-colors border-l-2 pl-2 -ml-[17px] ${
                  isActive
                    ? "border-[var(--accent)] text-[var(--accent)] font-medium bg-[var(--bg-surface)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {item.text}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
