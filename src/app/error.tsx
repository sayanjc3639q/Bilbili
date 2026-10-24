"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log error to monitoring service
  }, [error]);

  return (
    <div className="reading-column py-16 text-center">
      <div className="w-12 h-12 mx-auto mb-4 border border-[var(--callout-warning-border)] bg-[var(--callout-warning-bg)] rounded flex items-center justify-center text-amber-600">
        <AlertCircle className="w-6 h-6" />
      </div>

      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
        An unexpected error occurred
      </h1>
      <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-6">
        {error.message || "We encountered an issue rendering this section."}
      </p>

      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded hover:border-[var(--accent)] transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Try Again</span>
      </button>
    </div>
  );
}
