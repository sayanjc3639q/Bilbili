import React from "react";

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
 * - *text* or **text** -> Bold
 * - _text_ -> Italic
 * - `text` -> Inline monospace code
 */
export function renderFormattedInline(text: string, keyPrefix = ""): React.ReactNode {
  if (!text) return null;

  // Regex matching inline code, bold (*text* or **text**), and italic (_text_)
  const regex = /(`[^`\n]+`|\*{1,2}(?!\s)[^*\n]+?(?<!\s)\*{1,2}|_(?!\s)[^_\n]+?(?<!\s)_)/g;
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
    if (token.startsWith("`")) {
      elements.push(
        <code
          key={`${keyPrefix}code_${tokenIdx++}`}
          className="px-1.5 py-0.5 rounded bg-[var(--code-bg)] text-[var(--code-text)] font-mono text-[0.88em] border border-[var(--border-color)]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("*")) {
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
    } else if (token.startsWith("_")) {
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
