import React from "react";
import Link from "next/link";

interface FormattedTextProps {
  text?: string;
  className?: string;
}

export function FormattedText({ text, className }: FormattedTextProps) {
  if (!text) return null;
  return <span className={className}>{renderFormattedInline(text)}</span>;
}

/**
 * Parses inline formatting:
 * - $<slug>{Anchor Text} -> Internal blog link (e.g. $<Markup-Language>{Markup Language})
 * - [text](url) -> External or direct link
 * - *text* or **text** -> Bold
 * - _text_ -> Italic
 * - `text` -> Inline monospace code
 */
export function renderFormattedInline(text: string, keyPrefix = ""): React.ReactNode {
  if (!text) return null;

  // Regex matches:
  // 1. Internal link syntax: $<slug>{text}
  // 2. Markdown link syntax: [text](url)
  // 3. Inline code: `code`
  // 4. Bold: *text* or **text**
  // 5. Italic: _text_
  const regex =
    /(\$<([^>]+)>\{([^}]+)\}|\[([^\]]+)\]\(([^)]+)\)|`[^`\n]+`|\*{1,2}(?!\s)[^*\n]+?(?<!\s)\*{1,2}|_(?!\s)[^_\n]+?(?<!\s)_)/g;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let tokenIdx = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(
        <React.Fragment key={`${keyPrefix}txt_${tokenIdx++}`}>
          {text.slice(lastIndex, match.index)}
        </React.Fragment>
      );
    }

    const token = match[0];

    // Internal link: $<slug>{Anchor Text}
    if (token.startsWith("$<")) {
      const targetSlug = match[2]?.trim() || "";
      const anchorText = match[3] || "";
      const normalizedSlug = targetSlug
        .toLowerCase()
        .replace(/_/g, "-")
        .replace(/\s+/g, "-");
      const href = normalizedSlug.startsWith("/") ? normalizedSlug : `/blog/${normalizedSlug}`;

      elements.push(
        <Link
          key={`${keyPrefix}ilink_${tokenIdx++}`}
          href={href}
          className="font-medium text-[var(--accent)] hover:underline decoration-1 underline-offset-2 transition-colors inline"
        >
          {renderFormattedInline(anchorText, `${keyPrefix}il_${tokenIdx}_`)}
        </Link>
      );
    }
    // Markdown link: [text](url)
    else if (token.startsWith("[") && match[4] && match[5]) {
      const anchorText = match[4];
      const url = match[5].trim();
      const isExternal = url.startsWith("http://") || url.startsWith("https://");

      if (isExternal) {
        elements.push(
          <a
            key={`${keyPrefix}elink_${tokenIdx++}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--accent)] hover:underline decoration-1 underline-offset-2 transition-colors inline"
          >
            {renderFormattedInline(anchorText, `${keyPrefix}el_${tokenIdx}_`)}
          </a>
        );
      } else {
        elements.push(
          <Link
            key={`${keyPrefix}mlink_${tokenIdx++}`}
            href={url}
            className="font-medium text-[var(--accent)] hover:underline decoration-1 underline-offset-2 transition-colors inline"
          >
            {renderFormattedInline(anchorText, `${keyPrefix}ml_${tokenIdx}_`)}
          </Link>
        );
      }
    }
    // Inline code: `code`
    else if (token.startsWith("`")) {
      elements.push(
        <code
          key={`${keyPrefix}code_${tokenIdx++}`}
          className="px-1.5 py-0.5 rounded bg-[var(--code-bg)] text-[var(--code-text)] font-mono text-[0.88em] border border-[var(--border-color)]"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    // Bold: *text* or **text**
    else if (token.startsWith("*")) {
      const isDouble = token.startsWith("**") && token.endsWith("**");
      const inner = isDouble ? token.slice(2, -2) : token.slice(1, -1);
      elements.push(
        <strong
          key={`${keyPrefix}b_${tokenIdx++}`}
          className="font-bold text-[var(--text-primary)]"
        >
          {renderFormattedInline(inner, `${keyPrefix}b_${tokenIdx}_`)}
        </strong>
      );
    }
    // Italic: _text_
    else if (token.startsWith("_")) {
      const inner = token.slice(1, -1);
      elements.push(
        <em key={`${keyPrefix}i_${tokenIdx++}`} className="italic">
          {renderFormattedInline(inner, `${keyPrefix}i_${tokenIdx}_`)}
        </em>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(
      <React.Fragment key={`${keyPrefix}txt_end`}>
        {text.slice(lastIndex)}
      </React.Fragment>
    );
  }

  return elements.length === 1 ? elements[0] : <>{elements}</>;
}

export type ParagraphSegment =
  | { type: "prose"; text: string }
  | { type: "bullet_list"; items: string[] }
  | { type: "numbered_list"; items: string[] };

/**
 * Parses multiline paragraph text into contiguous segments:
 * - Lines starting with "- " become bullet list items
 * - Lines starting with "n- " or "<number>- " become numbered list items
 * - Other lines form standard prose paragraphs
 */
export function parseParagraphIntoSegments(text: string): ParagraphSegment[] {
  if (!text) return [];

  const lines = text.split("\n");
  const segments: ParagraphSegment[] = [];
  let currentProse: string[] = [];
  let currentBullets: string[] = [];
  let currentNumbered: string[] = [];

  const flushProse = () => {
    if (currentProse.length > 0) {
      const combined = currentProse.join("\n").trim();
      if (combined) {
        segments.push({ type: "prose", text: combined });
      }
      currentProse = [];
    }
  };

  const flushBullets = () => {
    if (currentBullets.length > 0) {
      segments.push({ type: "bullet_list", items: currentBullets });
      currentBullets = [];
    }
  };

  const flushNumbered = () => {
    if (currentNumbered.length > 0) {
      segments.push({ type: "numbered_list", items: currentNumbered });
      currentNumbered = [];
    }
  };

  for (const rawLine of lines) {
    // Check for bullet line: "- item" or "-item"
    const bulletMatch = rawLine.match(/^\s*-\s+(.*)$/) || rawLine.match(/^\s*-(.+)$/);
    // Check for numbered line: "n- item", "1- item", "1. item"
    const numberedMatch = rawLine.match(/^\s*(?:n|\d+)[-.]\s*(.*)$/);

    if (bulletMatch && bulletMatch[1].trim()) {
      flushProse();
      flushNumbered();
      currentBullets.push(bulletMatch[1].trim());
    } else if (numberedMatch && numberedMatch[1].trim()) {
      flushProse();
      flushBullets();
      currentNumbered.push(numberedMatch[1].trim());
    } else if (rawLine.trim() === "") {
      flushProse();
      flushBullets();
      flushNumbered();
    } else {
      flushBullets();
      flushNumbered();
      currentProse.push(rawLine);
    }
  }

  flushProse();
  flushBullets();
  flushNumbered();

  return segments;
}
