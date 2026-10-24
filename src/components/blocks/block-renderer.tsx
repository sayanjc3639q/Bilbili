"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Link2, AlertCircle, Info, ExternalLink } from "lucide-react";
import type { Block } from "@/types";
import { FormattedText, parseParagraphIntoSegments } from "./formatted-text";

// Dynamic imports for heavy components
const DynamicEquationBlock = dynamic(
  () => import("./equation-block"),
  {
    loading: () => (
      <div className="my-4 h-12 bg-[var(--bg-surface)] animate-pulse rounded border border-[var(--border-color)]" />
    ),
  }
);

const DynamicCodeBlock = dynamic(
  () => import("./code-block"),
  {
    loading: () => (
      <div className="my-6 h-28 bg-[var(--bg-surface)] animate-pulse rounded border border-[var(--border-color)]" />
    ),
  }
);

interface BlockRendererProps {
  blocks: Block[];
  isFirstImagePriority?: boolean;
}

export function BlockRenderer({ blocks, isFirstImagePriority = true }: BlockRendererProps) {
  let hasRenderedFirstImage = false;

  return (
    <div className="space-y-6">
      {blocks.map((block) => {
        switch (block.type) {
          case "subtitle": {
            const anchorId = block.id;
            const level = block.level || 2;
            const content = (
              <>
                <span>
                  <FormattedText text={block.text} />
                </span>
                <Link
                  href={`#${anchorId}`}
                  className="opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-opacity p-1"
                  aria-label={`Link to section: ${block.text}`}
                >
                  <Link2 className="w-4 h-4" />
                </Link>
              </>
            );

            if (level === 3) {
              return (
                <h3
                  key={block.id}
                  id={anchorId}
                  className="group flex items-center gap-2 pt-5 pb-1.5 text-xl font-bold tracking-tight text-[var(--text-primary)] mt-6 first:mt-0"
                >
                  {content}
                </h3>
              );
            }

            if (level === 4) {
              return (
                <h4
                  key={block.id}
                  id={anchorId}
                  className="group flex items-center gap-2 pt-4 pb-1 text-lg font-semibold tracking-tight text-[var(--text-primary)] mt-5 first:mt-0"
                >
                  {content}
                </h4>
              );
            }

            if (level === 5) {
              return (
                <h5
                  key={block.id}
                  id={anchorId}
                  className="group flex items-center gap-2 pt-3 pb-1 text-base font-semibold tracking-tight text-[var(--text-primary)] mt-4 first:mt-0"
                >
                  {content}
                </h5>
              );
            }

            return (
              <h2
                key={block.id}
                id={anchorId}
                className="group flex items-center gap-2 pt-6 pb-2 text-2xl font-bold tracking-tight text-[var(--text-primary)] border-b border-[var(--border-color)] mt-8 first:mt-0"
              >
                {content}
              </h2>
            );
          }

          case "paragraph": {
            const segments = parseParagraphIntoSegments(block.text);
            return (
              <div key={block.id} className="space-y-3">
                {segments.map((seg, sIdx) => {
                  if (seg.type === "bullet_list") {
                    return (
                      <ul
                        key={sIdx}
                        className="my-3 pl-6 list-disc space-y-1.5 text-base sm:text-[17.5px] leading-relaxed text-[var(--text-primary)]"
                      >
                        {seg.items.map((item, i) => (
                          <li key={i}>
                            <FormattedText text={item} />
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  if (seg.type === "numbered_list") {
                    return (
                      <ol
                        key={sIdx}
                        className="my-3 pl-6 list-decimal space-y-1.5 text-base sm:text-[17.5px] leading-relaxed text-[var(--text-primary)]"
                      >
                        {seg.items.map((item, i) => (
                          <li key={i}>
                            <FormattedText text={item} />
                          </li>
                        ))}
                      </ol>
                    );
                  }
                  return (
                    <p
                      key={sIdx}
                      className="text-base sm:text-[17.5px] leading-relaxed text-[var(--text-primary)] font-normal whitespace-pre-line"
                    >
                      <FormattedText text={seg.text} />
                    </p>
                  );
                })}
              </div>
            );
          }

          case "bullet_list":
            return (
              <ul
                key={block.id}
                className="my-3 pl-6 list-disc space-y-2 text-base sm:text-[17.5px] leading-relaxed text-[var(--text-primary)]"
              >
                {block.items.map((item, idx) => (
                  <li key={idx}>
                    <FormattedText text={item} />
                  </li>
                ))}
              </ul>
            );

          case "numbered_list":
            return (
              <ol
                key={block.id}
                className="my-3 pl-6 list-decimal space-y-2 text-base sm:text-[17.5px] leading-relaxed text-[var(--text-primary)]"
              >
                {block.items.map((item, idx) => (
                  <li key={idx}>
                    <FormattedText text={item} />
                  </li>
                ))}
              </ol>
            );

          case "table":
            return (
              <div
                key={block.id}
                className="my-6 overflow-x-auto border border-[var(--border-color)] rounded bg-[var(--bg-surface)]"
              >
                <table className="w-full text-left border-collapse text-sm">
                  {block.hasHeader && block.rows.length > 0 && (
                    <thead>
                      <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                        {block.rows[0].map((cell, cIdx) => (
                          <th
                            key={cIdx}
                            className="p-3 font-semibold text-[var(--text-primary)] border-r last:border-r-0 border-[var(--border-color)]"
                          >
                            <FormattedText text={cell} />
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {(block.hasHeader ? block.rows.slice(1) : block.rows).map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="border-b last:border-b-0 border-[var(--border-color)] hover:bg-[var(--bg-main)] transition-colors"
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="p-3 text-[var(--text-primary)] border-r last:border-r-0 border-[var(--border-color)]"
                          >
                            <FormattedText text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "image": {
            const priority = isFirstImagePriority && !hasRenderedFirstImage;
            hasRenderedFirstImage = true;
            return (
              <figure key={block.id} className="my-6">
                <div className="relative w-full aspect-video border border-[var(--border-color)] rounded overflow-hidden bg-[var(--bg-surface)]">
                  <Image
                    src={block.url}
                    alt={block.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 720px"
                    priority={priority}
                    loading={priority ? undefined : "lazy"}
                    className="object-cover"
                  />
                </div>
                {block.caption && (
                  <figcaption className="text-center text-xs text-[var(--text-secondary)] mt-2 italic">
                    <FormattedText text={block.caption} />
                  </figcaption>
                )}
              </figure>
            );
          }

          case "code":
            return (
              <DynamicCodeBlock
                key={block.id}
                code={block.code}
                language={block.language}
                filename={block.filename}
              />
            );

          case "callout": {
            const isWarning = block.kind === "warning";
            return (
              <div
                key={block.id}
                role="region"
                aria-label={isWarning ? "Warning callout" : "Note callout"}
                className={`my-6 p-4 rounded border ${
                  isWarning
                    ? "bg-[var(--callout-warning-bg)] border-[var(--callout-warning-border)] text-[var(--callout-warning-text)]"
                    : "bg-[var(--callout-note-bg)] border-[var(--callout-note-border)] text-[var(--callout-note-text)]"
                }`}
              >
                <div className="flex items-start gap-3">
                  {isWarning ? (
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                  )}
                  <div className="flex-1 space-y-1">
                    {block.title && (
                      <div className="font-semibold text-sm">
                        <FormattedText text={block.title} />
                      </div>
                    )}
                    <div className="text-sm leading-relaxed whitespace-pre-line">
                      <FormattedText text={block.text} />
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          case "equation":
            return (
              <DynamicEquationBlock
                key={block.id}
                formula={block.formula}
                isBlock={block.isBlock}
              />
            );

          case "link": {
            let hostname = "External Link";
            try {
              const urlObj = new URL(
                block.url.startsWith("http") ? block.url : `https://${block.url}`
              );
              hostname = urlObj.hostname;
            } catch {
              hostname = block.url;
            }

            return (
              <a
                key={block.id}
                href={block.url.startsWith("http") ? block.url : `https://${block.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="my-5 p-4 border border-[var(--border-color)] rounded bg-[var(--bg-surface)] hover:border-[var(--accent)] transition-colors flex items-start justify-between gap-4 group block no-underline"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--accent)] font-medium mb-1">
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{hostname}</span>
                  </div>
                  <div className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                    <FormattedText text={block.title} />
                  </div>
                  {block.description && (
                    <div className="text-xs text-[var(--text-secondary)] mt-1.5 line-clamp-2 leading-relaxed">
                      <FormattedText text={block.description} />
                    </div>
                  )}
                </div>
              </a>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}
