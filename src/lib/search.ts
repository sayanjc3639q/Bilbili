import type { SearchIndexItem } from "@/types";

/**
 * Lightweight, zero-dependency fuzzy scoring algorithm
 * Computes a score based on prefix matches, word starts, and consecutive character matches.
 */
export function scoreFuzzyMatch(query: string, target: string): number {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();

  if (!q) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 80 + (q.length / t.length) * 15;
  if (t.includes(q)) return 50 + (q.length / t.length) * 20;

  // Character-by-character fuzzy match
  let score = 0;
  let qIdx = 0;
  let prevMatchIdx = -2;

  for (let tIdx = 0; tIdx < t.length && qIdx < q.length; tIdx++) {
    if (t[tIdx] === q[qIdx]) {
      score += 5;
      if (tIdx === prevMatchIdx + 1) {
        score += 8; // bonus for consecutive matching characters
      }
      if (tIdx === 0 || t[tIdx - 1] === " " || t[tIdx - 1] === "-") {
        score += 10; // bonus for word start
      }
      prevMatchIdx = tIdx;
      qIdx++;
    }
  }

  return qIdx === q.length ? score : 0;
}

/**
 * Search the compact index with ranked scores
 */
export function searchCompactIndex(
  query: string,
  items: SearchIndexItem[],
  maxResults = 8
): { item: SearchIndexItem; score: number }[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  const results: { item: SearchIndexItem; score: number }[] = [];

  for (const item of items) {
    // Score against title (highest weight)
    const titleScore = scoreFuzzyMatch(clean, item.title) * 2.5;

    // Score against keywords
    let keywordScore = 0;
    for (const kw of item.keywords || []) {
      const s = scoreFuzzyMatch(clean, kw);
      if (s > keywordScore) keywordScore = s;
    }

    // Score against excerpt
    const excerptScore = scoreFuzzyMatch(clean, item.excerpt || "") * 0.5;

    const totalScore = Math.max(titleScore, keywordScore * 1.5, excerptScore);

    if (totalScore > 0) {
      results.push({ item, score: totalScore });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, maxResults);
}

/**
 * Splits text into segments for rendering highlighted search terms
 */
export function highlightMatchSegments(
  text: string,
  query: string
): { text: string; isMatch: boolean }[] {
  if (!query.trim()) {
    return [{ text, isMatch: false }];
  }

  const clean = query.trim();
  const regex = new RegExp(`(${clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);

  return parts.map((part) => ({
    text: part,
    isMatch: part.toLowerCase() === clean.toLowerCase(),
  }));
}
