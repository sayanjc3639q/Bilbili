"use client";

import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface EquationBlockProps {
  formula: string;
  isBlock?: boolean;
}

export default function EquationBlock({ formula, isBlock = true }: EquationBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(formula, containerRef.current, {
          displayMode: isBlock,
          throwOnError: false,
        });
      } catch {
        containerRef.current.innerText = formula;
      }
    }
  }, [formula, isBlock]);

  return (
    <div className={`overflow-x-auto my-4 py-2 text-[var(--text-primary)] ${isBlock ? "text-center" : "inline-block"}`}>
      <span ref={containerRef} />
    </div>
  );
}
