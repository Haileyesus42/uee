// Cleans `-layout` pdftotext output for the textbook reader. `-layout` mode was
// chosen over plain mode after hand-testing both on this specific book: plain
// mode scrambles body text word-by-word wherever the source page uses a 2-column
// layout (confirmed — completely unreadable), while `-layout` keeps ordinary
// single/near-single-column body prose fully coherent (confirmed clean on
// several sample pages). Handles three artifacts confirmed by hand:
//
// 1. Repeated running headers/footers ("BIOLOGY GRADE 11", "UNIT 2: ANIMALS",
//    "STUDENT TEXTBOOK") appear on every page — stripped by exact/near-exact
//    line match against a caller-supplied set of known repeating strings.
// 2. Hyphenated line-break words ("envi-" + "ronment") — rejoined.
// 3. Wingdings/Symbol-font bullet glyphs that had no proper Unicode mapping in
//    the source PDF extract as Private Use Area codepoints (U+E000-F8FF), which
//    render as a "missing glyph" tofu box on a device with no matching font —
//    replaced with a real bullet character.
//
// KNOWN, DISCLOSED LIMITATION (not silently swept under the rug): this book's
// "Unit learning outcomes" / "Self-questioning" / "Inquiry activity" sidebar
// boxes sit visually next to the first paragraph or two of most sections, and
// `-layout` mode interleaves a short phrase from the sidebar into the middle of
// the adjacent body sentence on some pages (e.g. "...the student will be able
// to: Self-questioning Before starting this section..."). Reconstructing true
// multi-column reading order would need `pdftotext -bbox` word-coordinate data
// and real column-clustering logic — a substantially bigger task than this v1
// pass, deferred rather than attempted with a fragile heuristic that (tested by
// hand) made output worse, not better. Affects roughly the first paragraph of
// each section; the bulk of body prose reads cleanly.

const HYPHEN_BREAK = /-\s*$/;
const PUA_START = 0xe000;
const PUA_END = 0xf8ff;

function replacePuaGlyphs(text: string): string {
  return Array.from(text)
    .map((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return code >= PUA_START && code <= PUA_END ? '•' : ch;
    })
    .join('');
}

function looksLikeHeaderOrFooter(line: string, knownHeaders: Set<string>): boolean {
  const normalized = line.trim().toUpperCase();
  if (!normalized) return false;
  for (const h of knownHeaders) {
    if (normalized.includes(h)) return true;
  }
  if (/^UNIT\s+[A-Z0-9]+\s*:/.test(normalized) && normalized.length < 60) return true;
  if (/MINISTRY OF EDUCATION|FDRE-MOE/.test(normalized)) return true;
  return false;
}

// pdftotext (-layout) inserts a real form-feed (\f) between pages, but places
// it immediately before the NEXT page's header line rather than as a standalone
// line — so naive per-line filtering misses the still-attached page-footer +
// next-page-header pair that ends up glued onto one physical line at the seam.
// Splitting on \f first and stripping the first/last non-blank line of each
// page chunk (conditionally, only if it actually looks like a header/footer —
// confirmed by sampling 9 consecutive pages that this holds for the header line
// ~90%+ of the time) is far more reliable than pattern-matching arbitrary lines.
function stripPageHeadersFooters(rawText: string, knownHeaders: Set<string>): string {
  const pages = rawText.split('\f');
  const cleanedPages = pages.map((page) => {
    const lines = page.split('\n');
    let start = 0;
    let end = lines.length - 1;
    while (start <= end && lines[start].trim() === '') start += 1;
    while (end >= start && lines[end].trim() === '') end -= 1;
    if (start <= end && looksLikeHeaderOrFooter(lines[start], knownHeaders)) start += 1;
    if (end >= start && looksLikeHeaderOrFooter(lines[end], knownHeaders)) end -= 1;
    return lines.slice(start, end + 1).join('\n');
  });
  return cleanedPages.join('\n\n'); // force a paragraph break at every page boundary
}

export function cleanTextbookPage(rawText: string, knownHeaders: Set<string>): string[] {
  const withoutHeaders = stripPageHeadersFooters(rawText, knownHeaders);
  const lines = withoutHeaders.split('\n').map((l) => replacePuaGlyphs(l).replace(/\s+/g, ' ').trim());

  const merged: string[] = [];
  for (const line of lines) {
    const prev = merged[merged.length - 1];
    if (line === '') {
      merged.push('');
      continue;
    }
    if (prev && HYPHEN_BREAK.test(prev)) {
      merged[merged.length - 1] = prev.replace(HYPHEN_BREAK, '') + line;
      continue;
    }
    merged.push(line);
  }

  // Blank-line-separated paragraphs, whitespace-normalized.
  const paragraphs: string[] = [];
  let current: string[] = [];
  for (const line of merged) {
    if (line === '') {
      if (current.length > 0) {
        paragraphs.push(current.join(' ').replace(/\s+/g, ' ').trim());
        current = [];
      }
      continue;
    }
    current.push(line);
  }
  if (current.length > 0) paragraphs.push(current.join(' ').replace(/\s+/g, ' ').trim());

  return paragraphs.filter((p) => p.length > 0);
}
