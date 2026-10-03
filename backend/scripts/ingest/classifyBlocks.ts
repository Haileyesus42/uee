// Turns pdfStructure.ts's raw text-run geometry+style into a document model:
// heading / paragraph / list / table nodes, in reading order. Consumed by
// extractTextbookSections.ts in place of the old flat-paragraph cleanup.
//
// Built on `pdftohtml -xml` (via pdfStructure.ts), which exposes bold/font/
// color alongside position — pdftotext -bbox-layout (this file's original
// approach) only had position, which made heading-vs-label detection
// fundamentally ambiguous (a bold callout-box label like "Self-questioning"
// and a real section heading can be the same line height) and needed
// several fragile follow-on heuristics to patch false positives. With style
// data: a heading is bold AND meaningfully larger than body text; a bold
// run at body size is a callout-box label, not a heading — directly
// observed on grade-11 biology page 12 ("Self-questioning" is bold, 17pt,
// same as body; "1.1 Learning from nature" is bold, 21pt, clearly bigger).
import { PageStructure, TextRun } from './pdfStructure';

export type DocNode =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'table'; rows: string[][]; caption?: string };

// Same heuristic as textCleanup.ts's HYPHEN_BREAK join (reused, not
// reimplemented): a line ending in a hyphen almost always means the word
// wrapped ("photo-" / "synthesis"), not a genuine hyphenated word that
// happened to fall at a line break — text-only extraction can't reliably
// tell the two apart (a real dictionary lookup could, but that's out of
// scope here), so this accepts the same known trade-off already in place
// elsewhere in this pipeline rather than inventing a different one.
const HYPHEN_BREAK = /-\s*$/;
function joinText(a: string, b: string): string {
  return HYPHEN_BREAK.test(a) ? a.replace(HYPHEN_BREAK, '') + b : `${a} ${b}`;
}

// Bullet glyphs that DO have a real Unicode mapping in the source font.
// Most don't — a bullet's symbol-font character has no ToUnicode mapping,
// so it extracts as a Private Use Area codepoint or empty text rather than
// a real bullet character (confirmed by hand: grade-11 biology's bullets
// are U+F0B7, rendered in a "Symbol"-named font — see isBulletMarkerRun,
// which checks the font family directly now that it's available).
const PUA_START = 0xe000;
const PUA_END = 0xf8ff;
const BULLET_CHARS = new Set(['•', '●', '○', '▪', '▫', '◦', '‣', '∙']);
const ORDINAL_PREFIX = /^(\d{1,3}\.|\(\d{1,3}\)|[a-z]\.|[ivxlc]{1,4}\.|[IVXLC]{1,4}\.)\s+/;

function isPuaGlyph(s: string): boolean {
  if (Array.from(s).length !== 1) return false;
  const code = s.codePointAt(0) ?? 0;
  return code >= PUA_START && code <= PUA_END;
}

// C0/C1 control codepoints (0x00-0x1F, 0x7F-0x9F) have no business in
// extracted body text — hand-confirmed a 0x84 leaking straight through as
// its own "empty" text block (invisible in a terminal, but not actually the
// empty string, so `.trim()` alone didn't catch it) and elsewhere as a
// stray glyph mid-word. Same underlying cause as the PUA bullet glyphs —
// this font's custom symbol characters land on unassigned codepoints — but
// unlike a PUA bullet, there's no reliable "this one specific char always
// means bullet" mapping to fall back on here, so these are dropped rather
// than substituted for a visible marker.
function isControlGlyph(s: string): boolean {
  if (Array.from(s).length !== 1) return false;
  const code = s.codePointAt(0) ?? 0;
  return (code >= 0x00 && code <= 0x1f) || (code >= 0x7f && code <= 0x9f);
}

// A bullet glyph sometimes gets glued to the front of the next word with no
// space at all — hand-confirmed a glossary list extracting as "\x95Justinian"
// (control glyph fused to the term). Strips a leading PUA/control glyph off
// text so it can still be recognized as a marker instead of leaking the raw
// glyph into the term itself.
function splitLeadingGlyph(text: string): { hadGlyph: boolean; rest: string } {
  const chars = Array.from(text);
  const head = chars[0];
  if (head && (isPuaGlyph(head) || isControlGlyph(head)) && chars.length > 1) {
    return { hadGlyph: true, rest: chars.slice(1).join('') };
  }
  return { hadGlyph: false, rest: text };
}

function cleanRunText(text: string): string {
  if (isPuaGlyph(text)) return '•';
  if (isControlGlyph(text)) return '';
  const split = splitLeadingGlyph(text);
  return split.hadGlyph ? split.rest : text;
}

// One visual line: usually a single TextRun (pdftohtml groups by matching
// font, and uniform-style text tends to stay one run per line — confirmed
// by hand), but a bullet marker always lands as its own separate run
// (different font) immediately before the line's content run, so this
// still needs to group runs sharing a `top`.
type LineGroup = {
  runs: TextRun[]; // left-to-right
  top: number;
  left: number;
  right: number;
  bottom: number;
};

type ClassifiedLine = {
  group: LineGroup;
  text: string;
  fontSize: number;
  bold: boolean;
  listMarker: 'bullet' | 'ordinal' | null;
  contentText: string; // text with the marker stripped, for list items
  isLabelStyle: boolean; // bold, but NOT meaningfully bigger than body — a callout-box label, not a heading
};

const BULLET_WIDTH_MAX = 12; // pdftohtml's coordinate scale (~1.5x poppler's native pt units)

function isBulletMarkerRun(run: TextRun): boolean {
  if (/Symbol|Wingdings|Webdings/i.test(run.fontFamily) && run.width < BULLET_WIDTH_MAX) return true;
  if (isPuaGlyph(run.text)) return true;
  if (run.text.trim() === '' && run.width < BULLET_WIDTH_MAX) return true;
  return BULLET_CHARS.has(run.text.trim());
}

function groupText(runs: TextRun[]): string {
  return runs
    .map((r) => cleanRunText(r.text))
    .filter(Boolean)
    .join(' ')
    .trim();
}

function classifyLine(group: LineGroup, bodyFontSize: number): ClassifiedLine | null {
  const text = groupText(group.runs);
  const first = group.runs[0];
  if (!text && !isBulletMarkerRun(first)) return null; // fully blank line
  // A lone 1-4 digit number with nothing else on its line is essentially
  // always a stray page number, not content — hand-confirmed on a physics
  // book whose page numbers sit at ~11% of page height, outside the general
  // margin-based header/footer filter's threshold (biology's real headings
  // start as close as ~10%, so that filter can't safely widen further; this
  // is a narrower, safer rule for the specific shape of a page number).
  if (group.runs.length === 1 && /^\d{1,4}$/.test(text)) return null;

  let listMarker: ClassifiedLine['listMarker'] = null;
  let contentText = text;
  if (isBulletMarkerRun(first)) {
    listMarker = 'bullet';
    contentText = groupText(group.runs.slice(1));
  } else {
    const glyphSplit = splitLeadingGlyph(first.text);
    const ordinalMatch = first.text.trimStart().match(ORDINAL_PREFIX);
    if (glyphSplit.hadGlyph) {
      listMarker = 'bullet';
      contentText = groupText([{ ...first, text: glyphSplit.rest }, ...group.runs.slice(1)]);
    } else if (ordinalMatch) {
      listMarker = 'ordinal';
      const restOfFirst = first.text.trimStart().slice(ordinalMatch[0].length);
      contentText = groupText([{ ...first, text: restOfFirst }, ...group.runs.slice(1)]);
    }
  }

  // The line's own style = its first run's (a marker's font doesn't count —
  // look past it when there is one).
  const styleRun = listMarker ? (group.runs[1] ?? first) : first;
  const bold = styleRun?.bold ?? false;
  const fontSize = styleRun?.fontSize ?? bodyFontSize;
  const isLabelStyle = bold && fontSize < bodyFontSize * 1.15;

  return { group, text, fontSize, bold, listMarker, contentText, isLabelStyle };
}

// Mode (most common) font size among non-bold runs — bold headings/labels
// would skew a plain average, and using intrinsic run.fontSize instead of a
// measured bounding-box height (the old bbox-layout approach) means this no
// longer gets thrown off by line-merging joining a bold label with plain
// continuation text onto one taller-looking line — that was a real bug
// (isHeadingLine misfiring on "Profit Motive: Entrepreneurs, in their...").
function modalBodyFontSize(runs: TextRun[]): number {
  const counts = new Map<number, number>();
  for (const r of runs) {
    if (r.bold) continue;
    counts.set(r.fontSize, (counts.get(r.fontSize) ?? 0) + 1);
  }
  let best = 12;
  let bestCount = 0;
  for (const [size, c] of counts) {
    if (c > bestCount) {
      best = size;
      bestCount = c;
    }
  }
  return best;
}

const HEADING_NUMBERING = /^(Unit\s+[A-Za-z0-9]+\s*:|(\d+\.){1,3}\d*\.?\s+[A-Z])/;

// gapBefore = vertical gap from the previous line — Infinity where there's
// no meaningful predecessor (start of a page). Only gates the FALLBACK
// (non-bold or body-size) branch: a short, isolated, all-caps/numbered line
// with real whitespace before it is still usually a heading in these MoE
// textbooks even without a bold+bigger font signal, but a same-size line
// packed tight against the paragraph before it (no gap) is not — hand-
// confirmed false positives ("NOTE", "Startup Activity") in an economics
// book that had no isolating whitespace at all.
// Rejects single-letter/number fragments — hand-confirmed these are almost
// always diagram annotations (points on a supply-demand curve: "B", "E",
// "D") or a stray section number rendered in its own bold run separate from
// its title ("1.4" alone), not real headings, even though they pass every
// other check (bold, larger than body, isolated). Also catches a unit
// divider's title typeset with exaggerated letter-spacing ("U n i t") —
// each "word" is a single letter after splitting, so it's rejected the same
// way; that's a real heading, just one this pipeline can't reconstruct
// cleanly, and showing nothing beats showing "U n i t".
function hasRealWord(text: string): boolean {
  return text.split(/\s+/).some((w) => /[A-Za-z]{2,}/.test(w));
}

function isHeadingLine(l: ClassifiedLine, bodyFontSize: number, gapBefore: number): { level: 1 | 2 | 3 } | null {
  if (l.listMarker) return null; // list markers are never headings
  if (l.text.length === 0 || l.text.length > 90) return null;
  if (!hasRealWord(l.text)) return null;

  const sizeRatio = l.fontSize / bodyFontSize;
  if (l.bold && sizeRatio >= 1.15) {
    const level = sizeRatio >= 1.5 ? 1 : sizeRatio >= 1.3 ? 2 : 3;
    return { level };
  }
  if (l.isLabelStyle) return null; // bold but body-sized — a callout label, not a heading

  const looksNumbered = HEADING_NUMBERING.test(l.text);
  const isAllCaps = l.text === l.text.toUpperCase() && /[A-Z]/.test(l.text);
  const isIsolated = gapBefore > l.group.bottom - l.group.top; // more than one line's worth of gap
  if (isIsolated && (isAllCaps || looksNumbered) && l.text.split(' ').length <= 8) {
    return { level: 3 };
  }
  return null;
}

// Best-effort table detection: normal word-spacing on a line is a few pt;
// a much wider gap between two runs is a column boundary. Only fires when
// 3+ consecutive lines split into the SAME number of cells — a single line
// with a wide gap is far too common in ordinary prose (em-dashes, spaced
// captions) to trust on its own. Anything less confident falls through to
// ordinary paragraph handling — a clean paragraph beats a mangled grid.
const CELL_GAP = 30;
const TABLE_CAPTION = /^Table\s+\d+(\.\d+)*[:.]?\s*/i;

function splitCells(l: ClassifiedLine): string[] {
  const runs = l.group.runs;
  if (runs.length === 0) return [];
  const cells: string[][] = [[]];
  let prevRight = runs[0].left + runs[0].width;
  cells[0].push(runs[0].text);
  for (let i = 1; i < runs.length; i += 1) {
    const r = runs[i];
    if (r.left - prevRight > CELL_GAP) cells.push([]);
    cells[cells.length - 1].push(r.text);
    prevRight = r.left + r.width;
  }
  return cells.map((c) => c.join(' ').trim()).filter(Boolean);
}

function gapBetween(prev: ClassifiedLine | null, next: ClassifiedLine): number {
  return prev ? next.group.top - prev.group.bottom : Infinity;
}

// Real wrapped continuation lines start at roughly the same left edge as
// the line before (a few pt of hanging-indent variance, not more); this is
// what stops a spliced-in aside (from a different x-column) from getting
// silently reabsorbed into the paragraph it landed next to.
const SAME_FLOW_X_TOLERANCE = 60;
const SAME_FLOW_Y_GAP_MULTIPLE = 1.8;

function sameFlow(prev: ClassifiedLine, next: ClassifiedLine): boolean {
  const lineHeight = prev.group.bottom - prev.group.top || 20;
  const closeVertically = next.group.top - prev.group.bottom < lineHeight * SAME_FLOW_Y_GAP_MULTIPLE;
  const closeHorizontally = Math.abs(next.group.left - prev.group.left) < SAME_FLOW_X_TOLERANCE;
  return closeVertically && closeHorizontally;
}

function tryTable(lines: ClassifiedLine[], startIdx: number, bodyFontSize: number): { rows: string[][]; consumed: number } | null {
  const rows: string[][] = [];
  let i = startIdx;
  let expectedCells = -1;
  let prev: ClassifiedLine | null = null;
  while (i < lines.length) {
    const l = lines[i];
    if (l.listMarker || isHeadingLine(l, bodyFontSize, gapBetween(prev, l))) break;
    if (prev && !sameFlow(prev, l)) break;
    const cells = splitCells(l);
    if (cells.length < 2) break;
    if (expectedCells === -1) expectedCells = cells.length;
    else if (cells.length !== expectedCells) break;
    rows.push(cells);
    prev = l;
    i += 1;
  }
  if (rows.length < 3) return null;
  return { rows, consumed: i - startIdx };
}

// Groups a flat, already-reading-order-corrected list of classified lines
// into DocNodes: consecutive list-marker lines (plus their non-marker
// continuation lines) become one `list`; a confident run of column-aligned
// lines becomes a `table`; everything else is a paragraph (merging wrapped
// lines the same way), or a heading when isHeadingLine says so.
export function linesToNodes(lines: ClassifiedLine[], bodyFontSize: number): DocNode[] {
  const nodes: DocNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    const heading = isHeadingLine(l, bodyFontSize, gapBetween(i > 0 ? lines[i - 1] : null, l));
    if (heading) {
      nodes.push({ type: 'heading', level: heading.level, text: l.text });
      i += 1;
      continue;
    }

    const table = tryTable(lines, i, bodyFontSize);
    if (table) {
      // A "Table N.N: ..." caption immediately preceding this run, already
      // emitted as its own paragraph, belongs to this table instead.
      const prevNode = nodes[nodes.length - 1];
      let caption: string | undefined;
      if (prevNode?.type === 'paragraph' && TABLE_CAPTION.test(prevNode.text)) {
        caption = nodes.pop() && prevNode.text;
      }
      nodes.push({ type: 'table', rows: table.rows, caption });
      i += table.consumed;
      continue;
    }

    if (l.listMarker) {
      const ordered = l.listMarker === 'ordinal';
      const items: string[] = [];
      let itemText = l.contentText;
      let prev = l;
      i += 1;
      while (i < lines.length) {
        const next = lines[i];
        if (!sameFlow(prev, next)) break; // large gap — not the same flow (e.g. a column/aside splice)
        if (next.listMarker) {
          if ((next.listMarker === 'ordinal') !== ordered) break; // marker style changed — new list
          items.push(itemText.trim());
          itemText = next.contentText;
          prev = next;
          i += 1;
          continue;
        }
        if (isHeadingLine(next, bodyFontSize, gapBetween(prev, next))) break;
        // A non-marker line right after a list item, at roughly body size,
        // is that item's wrapped continuation.
        if (next.fontSize <= bodyFontSize * 1.15 && !next.isLabelStyle) {
          itemText = joinText(itemText, next.text);
          prev = next;
          i += 1;
          continue;
        }
        break;
      }
      items.push(itemText.trim());
      const nonEmptyItems = items.filter(Boolean);
      // A marker whose only content was glyph noise (stripped to nothing —
      // see cleanRunText) can leave every item empty; the schema requires
      // at least one, and an empty list isn't useful content either way.
      if (nonEmptyItems.length > 0) {
        nodes.push({ type: 'list', ordered, items: nonEmptyItems });
      }
      continue;
    }

    // Plain paragraph: merge this line with following non-marker,
    // non-heading, body-sized lines (wrapped text).
    let text = l.text;
    let prev = l;
    i += 1;
    while (i < lines.length) {
      const next = lines[i];
      if (!sameFlow(prev, next)) break;
      if (next.listMarker || isHeadingLine(next, bodyFontSize, gapBetween(prev, next))) break;
      if (next.fontSize > bodyFontSize * 1.15) break;
      text = joinText(text, next.text);
      prev = next;
      i += 1;
    }
    if (text.trim()) nodes.push({ type: 'paragraph', text: text.trim() });
  }

  return nodes;
}

// Running headers/footers repeat right at the page margins on every page,
// but NOT always the same fixed string — one book varies the header
// per-unit ("UNIT 2: ANIMALS" as well as "BIOLOGY GRADE 11"), another
// alternates between two formats at the same position. Strips
// unconditionally on position alone: a real heading essentially never
// starts within the top/bottom margin band — every heading checked this
// session sits well clear of it — so margin position by itself is a safe,
// general signal that doesn't depend on enumerating every header string a
// book happens to use. knownHeaders/MINISTRY_PATTERN stay as a second layer
// for a header that sits further out than even this on some other book.
const MARGIN_FRACTION = 0.09;
const MINISTRY_PATTERN = /MINISTRY OF EDUCATION|FDRE-MOE/i;

// Works on raw runs, before any line-grouping or column-splitting — a
// header/footer's position check doesn't need it, and filtering this early
// means the column-split step (which needs each side's actual content
// volume) never sees margin noise skewing that comparison.
function isHeaderFooterRun(r: TextRun, pageHeight: number, knownHeaders: Set<string>): boolean {
  const inMargin = r.top < pageHeight * MARGIN_FRACTION || r.top + r.height > pageHeight * (1 - MARGIN_FRACTION);
  if (inMargin) return true;
  const normalized = r.text.toUpperCase();
  if (MINISTRY_PATTERN.test(normalized)) return true;
  for (const h of knownHeaders) {
    if (normalized.includes(h)) return true;
  }
  return false;
}

function groupIntoLines(runs: TextRun[]): LineGroup[] {
  const sorted = [...runs].sort((a, b) => a.top - b.top || a.left - b.left);
  const groups: LineGroup[] = [];
  for (const r of sorted) {
    const last = groups[groups.length - 1];
    if (last && Math.abs(r.top - last.top) < 4) {
      last.runs.push(r);
      last.left = Math.min(last.left, r.left);
      last.right = Math.max(last.right, r.left + r.width);
      last.bottom = Math.max(last.bottom, r.top + r.height);
    } else {
      groups.push({ runs: [r], top: r.top, left: r.left, right: r.left + r.width, bottom: r.top + r.height });
    }
  }
  for (const g of groups) g.runs.sort((a, b) => a.left - b.left);
  return groups.sort((a, b) => a.top - b.top || a.left - b.left);
}

function mergeGroupsToOne(groups: LineGroup[]): LineGroup {
  return {
    runs: groups.flatMap((g) => g.runs),
    top: Math.min(...groups.map((g) => g.top)),
    left: Math.min(...groups.map((g) => g.left)),
    right: Math.max(...groups.map((g) => g.right)),
    bottom: Math.max(...groups.map((g) => g.bottom)),
  };
}

// poppler's `-xml` mode gives no <flow>/<block> grouping at all (just a flat
// list of runs in PDF-content-stream order, often not reading order), so
// this does its own geometric split. Two real cases hand-confirmed on
// grade-11 biology page 12, both needing different treatment:
//  - A narrow "Self-questioning" callout box (few lines, bold body-sized
//    label) that was interleaving mid-sentence into the main paragraph —
//    the exact bug from the reader screenshot. Now detected directly via
//    style (bold run at ~body font size — see ClassifiedLine.isLabelStyle)
//    rather than guessed from line count alone, which is what lets this
//    override the line-count cap below for a label-triggered box that runs
//    a bit long.
//  - A genuine two-column body-text layout further down the same page (two
//    tall, comparably-sized runs of prose side by side, no bold label at
//    all) — reading this row-by-row scrambles it; correct order is the
//    whole left column, then the whole right column.
//
// Split on the horizontal midpoint of the page's actual content width.
// Which side is "primary" is NOT always the left side — hand-confirmed a
// page where a narrow callout box sits on the LEFT while the flowing body
// paragraph continues on the RIGHT. A callout box is reliably short
// regardless of which side it lands on, so the side with more total lines
// is primary; this is checked instead of assumed.
const ASIDE_MAX_LINES = 7;
const ASIDE_MAX_LINES_LABELED = 14; // a label-triggered box gets more room — it's a confirmed callout, not a guess
const COLUMN_GAP_BREAK = 38;

// A run of secondary-column lines is confirmed as a callout box (not just
// guessed from being short) when its first line's own style is bold at
// roughly body font size — the same isLabelStyle test classifyLine uses,
// duplicated here in raw-run terms since classification hasn't happened yet
// at this point in the pipeline.
function startsWithCalloutLabel(group: LineGroup, bodyFontSize: number): boolean {
  const first = group.runs[0];
  if (!first) return false;
  if (/Symbol|Wingdings|Webdings/i.test(first.fontFamily)) return false; // a bullet marker, not a label
  return first.bold && first.fontSize < bodyFontSize * 1.15;
}

// Splits on RAW RUNS, not already-grouped lines — critical ordering: the two
// genuine columns on the "What is imitation?" section share almost the same
// `top` per row (both columns' first line sit at the same Y), so grouping
// into lines globally BEFORE splitting columns merges them into one
// garbled line (hand-confirmed: this was a real regression while building
// this version — a whole two-column paragraph came out as a bogus 7-row
// "table" because both columns' text landed in one line, wide gap between
// them read as a cell boundary). Splitting first, then grouping each side's
// runs into lines independently, keeps same-Y content from different
// columns from ever being compared to each other.
function splitColumns(allRuns: TextRun[], bodyFontSize: number): LineGroup[] {
  if (allRuns.length === 0) return [];
  const minX = Math.min(...allRuns.map((r) => r.left));
  const maxX = Math.max(...allRuns.map((r) => r.left + r.width));
  const midX = (minX + maxX) / 2;

  const left = allRuns.filter((r) => r.left < midX);
  const right = allRuns.filter((r) => r.left >= midX);
  const [primaryRuns, secondaryRuns] = left.length >= right.length ? [left, right] : [right, left];

  const primary = groupIntoLines(primaryRuns);
  if (secondaryRuns.length === 0) return primary;
  const secondaryLines = groupIntoLines(secondaryRuns);

  const segments: LineGroup[][] = [];
  let current: LineGroup[] = [];
  let lastY = -Infinity;
  for (const g of secondaryLines) {
    if (current.length > 0 && g.top - lastY > COLUMN_GAP_BREAK) {
      segments.push(current);
      current = [];
    }
    current.push(g);
    lastY = Math.max(lastY, g.bottom);
  }
  if (current.length > 0) segments.push(current);

  const result = [...primary];
  for (const seg of segments) {
    const maxLines = startsWithCalloutLabel(seg[0], bodyFontSize) ? ASIDE_MAX_LINES_LABELED : ASIDE_MAX_LINES;
    if (seg.length > maxLines) {
      result.push(...seg); // genuine column — appended whole, after primary
      continue;
    }
    const asideStartY = seg[0].top;
    let insertAt = result.length;
    for (let idx = 0; idx < result.length; idx += 1) {
      if (result[idx].top > asideStartY) {
        insertAt = idx;
        break;
      }
    }
    result.splice(insertAt, 0, mergeGroupsToOne(seg));
  }
  return result;
}

export function classifyPage(page: PageStructure, knownHeaders: Set<string> = new Set()): DocNode[] {
  const bodyRuns = page.runs.filter((r) => !isHeaderFooterRun(r, page.height, knownHeaders));
  const bodyFontSize = modalBodyFontSize(bodyRuns);
  const ordered = splitColumns(bodyRuns, bodyFontSize);
  const classified = ordered
    .map((g) => classifyLine(g, bodyFontSize))
    .filter((l): l is ClassifiedLine => l !== null);
  return linesToNodes(classified, bodyFontSize);
}
