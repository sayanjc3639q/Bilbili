/**
 * Strips markdown and inline formatting characters from preview/excerpt text.
 * Removes:
 * - Bold and italic markers: *text*, **text**, _text_, __text__
 * - Bullet prefixes: '- ', '* ', '+ ', '-*', etc.
 * - Numbered step prefixes: 'n- ', '1- ', '1. ', '1) '
 * - Internal link syntax: $<slug>{Anchor Text} -> Anchor Text
 * - Markdown links: [Anchor Text](url) -> Anchor Text
 * - Headers: '# Heading' -> 'Heading'
 * - Blockquotes: '> quote' -> 'quote'
 * - Inline code ticks: `code` -> code
 * - Strikethrough: ~~text~~ -> text
 * - Stray asterisks, underscores, bullet dashes
 */
export function cleanPreviewText(text?: string): string {
  if (!text) return "";

  return text
    // Replace internal links $<slug>{anchor} -> anchor
    .replace(/\$<[^>]+>\{([^}]+)\}/g, "$1")
    // Replace markdown links [anchor](url) -> anchor
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Replace headers and blockquotes
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s+/gm, "")
    // Remove bullets and numbering at start of lines WITHOUT swallowing bold *
    .replace(/^\s*[-+]\s*/gm, "")
    .replace(/^\s*\*\s+/gm, "")
    .replace(/^\s*(?:n|\d+)[-.)]\s*/gm, "")
    // Replace newlines with spaces
    .replace(/\r?\n+/g, " ")
    // Remove bold and italic pairs: **text**, *text*, __text__, _text_
    .replace(/\*\*([^*]+?)\*\*/g, "$1")
    .replace(/\*([^*\n]+?)\*/g, "$1")
    .replace(/__([^_]+?)__/g, "$1")
    .replace(/_([^_\n]+?)_/g, "$1")
    .replace(/`([^`\n]+?)`/g, "$1")
    .replace(/~~([^~]+?)~~/g, "$1")
    // Remove bullet dashes between items if any remain (e.g. ' - item' or ' -item')
    .replace(/\s+-\s*(?=[A-Za-z0-9])/g, " ")
    // Remove any remaining stray formatting characters (*, _, `)
    .replace(/[*_`]/g, "")
    // Remove leading and trailing dashes, bullets, or spaces
    .replace(/^[\s\-•*]+/, "")
    .replace(/[\s\-•*]+$/, "")
    // Collapse multiple whitespace
    .replace(/\s+/g, " ")
    .trim();
}
