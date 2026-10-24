"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

export default function CodeBlock({ code, language = "text", filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="my-6 rounded border border-[var(--border-color)] bg-[var(--code-bg)] text-[var(--code-text)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-surface)] text-xs text-[var(--text-secondary)] font-mono">
        <div className="flex items-center gap-2 truncate">
          {filename && <span className="font-semibold text-[var(--text-primary)]">{filename}</span>}
          {filename && <span>-</span>}
          <span className="uppercase">{language}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border border-[var(--border-color)] rounded bg-[var(--bg-main)] hover:border-[var(--accent)] text-[var(--text-primary)] transition-colors"
          aria-label={copied ? "Code copied to clipboard" : "Copy code"}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
