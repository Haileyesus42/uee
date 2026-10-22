// Generates a scripts/ingest/manifests/*.json file (the {subject, grade, pdfPath,
// sections} shape extractTextbookSections.ts consumes) automatically from a
// textbook PDF, instead of hand-typing page ranges like the original
// biology-g11.json manifest was.
//
// Two-phase approach, and NOT simply "read the printed page number next to each
// ToC entry": hand-checked against grade-11-biology and the ToC's own page
// numbers don't match reality (footer numbering resets to 1 at the first unit's
// content page, while the ToC lists Unit One at printed page "7" — a stale or
// differently-paginated ToC, apparently common in these MoE PDFs). So:
//   1. Parse the ToC pages for section TITLES and ORDER only, ignoring its page
//      numbers entirely.
//   2. Walk the body pages sequentially, searching for each expected heading in
//      turn (monotonic — never search backward), and record the real PDF page
//      where it's found. pageEnd of each section = next boundary's page - 1.
//
// Usage:
//   npm run ingest:manifest -- --pdf assets/books/<file>.pdf --subject biology --grade 11
//   npm run ingest:manifest -- --pdf assets/books/<file>.pdf --subject biology --grade 11 --curriculum old
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { basename, relative, resolve } from 'node:path';
import { pdfPageCount, pdfPageText } from './pdfText';

type Boundary =
  | { kind: 'unit'; unitNum: string; title: string }
  | { kind: 'section'; unitNum: string; sectionNum: string; title: string; matchByTitle?: boolean }
  | { kind: 'end-marker'; unitNum: string };

type ManifestSection = { unitTitle: string; sectionTitle: string; pageStart: number; pageEnd: number };

// Gap between a ToC title and its trailing page number varies a lot across
// these books: a run of dots ("nature ....... 8"), dashes ("History---1"),
// spaced-out dots (". . . . .   2"), plain whitespace ("Introduction  2"), or
// a font-encoding artifact (U+FFFD / Private Use Area codepoints where a
// custom leader-dot glyph had no Unicode mapping — same PUA range
// textCleanup.ts already treats as "broken glyph", seen in
// citizenship-education). Deliberately NOT widened to "any symbol" — tried
// that, and it started misreading equation-heavy physics/chemistry/geography
// body pages (e.g. "3.0 x 10^8") as ToC lines. Title text otherwise never
// ends this way, so this stays a safe, narrow anchor.
// U+2026 (…) is in the leader set because several MoE books (notably the
// mathematics series) use it as the ToC leader glyph instead of ASCII dots;
// without it the whole dot run is captured into the title
// ("Unit 1: FURTHER ON SETS….………………………").
const LEADER_CHARS = '\\s.\\-_\\uFFFD\\uE000-\\uF8FF\\u2026';
const LEADER = new RegExp(`[${LEADER_CHARS}]{2,}\\d{1,4}\\s*$`);
// The colon is optional: student books write "Unit 1: Introduction to Biology",
// while several teacher guides write "Unit 1 Biology and technology".
const UNIT_TOC_LINE = new RegExp(`^\\s*Unit\\s+([A-Za-z0-9]+)\\s*:?\\s+(.+?)[${LEADER_CHARS}]{2,}\\d{1,4}\\s*$`, 'i');
const UNIT_BARE_LINE = /^\s*UNIT\s+([A-Za-z0-9]+)\s*:?\s*$/i;
const TRAILING_LEADER_NUM = new RegExp(`[${LEADER_CHARS}]{2,}\\d{1,4}\\s*$`);
const SECTION_TOC_LINE = new RegExp(`^\\s*(\\d+)\\.(\\d+)\\.?\\s+(.+?)[${LEADER_CHARS}]{2,}\\d{1,4}\\s*$`);
const END_MARKER_TOC_LINE = new RegExp(
  `^\\s*Unit\\s+([A-Za-z0-9]+)\\s+(?:summary|review\\s+questions?)\\b.*[${LEADER_CHARS}]{2,}\\d{1,4}\\s*$`,
  'i'
);
// Every unit's opening page carries its own mini outline ("Unit Contents" /
// "Contents", then bare "1.1 Title" lines with no leader/page-number at all —
// unlike the book's front ToC, which always has one). These bare lines match
// SECTION_TOC_LINE's shape just as well as a real in-body heading does, and
// since this page sits right at the start of the unit's own page range,
// locateBoundaryPages (searching forward, never backward) hits it before the
// real headings and "locates" every section of the unit here — confirmed on
// grade-9 mathematics, where 1.1-1.4 all resolved to the single page carrying
// Unit 1's own contents list. Skipping the whole page once this marker is seen
// avoids it entirely, rather than trying to pattern-match around it.
const UNIT_CONTENTS_MARKER = /^\s*Unit\s+Contents?\s*$/i;

// grade-10 citizenship-education's heading box lays out inconsistently under
// pdftotext: about half its lessons read fine as "LESSON" then "N.M Title"
// together on the next line (already matched by SECTION_TOC_LINE-shaped logic
// below), but the other half split the number onto its own bare line BEFORE
// "LESSON", with the title only appearing 1-2 lines after it — hand-confirmed
// by diffing which of this book's headings resolved vs. not (e.g. "1.3" alone,
// then "LESSON", then "Institutionalizing democracy" on the next line).
// Gated on an actual "LESSON" line immediately following the bare number so
// this can't misfire on some unrelated bare "N.M" elsewhere in body text.
const BARE_SECTION_NUM = /^(\d+)\.(\d+)\.?\s*$/;
const LESSON_LABEL_LINE = /^LESSON\b/i;
const PURE_NUMBER_LINE = /^\d{1,2}$/; // the lesson's own running index (1, 2, 3…), not a section number

// grade-11 civics-and-ethical-education (chilot) numbers its lessons "1.", "2."…
// resetting within each unit, instead of the "1.1"/"1.2" unit.section style
// every other book here uses — so SECTION_TOC_LINE's two-number shape never
// matches this book's ToC at all. Recovered by tracking which unit we're
// under while scanning the ToC (see currentUnitNum in parseOutline) and
// synthesizing the same "<unit>.<lesson>" sectionNum downstream code expects.
const SECTION_TOC_LINE_SIMPLE = new RegExp(`^\\s*(\\d{1,2})\\.\\s+(.+?)[${LEADER_CHARS}]{2,}\\d{1,4}\\s*$`);
// A third ToC shape, common across teacher guides: no section numbers at all,
// just "Definition of Biology ......... 2" under a "Unit 1: Introduction to
// Biology" heading. Section numbers are synthesized from position within the
// unit, and the body headings are matched by title instead of number — see
// `matchByTitle` in locateBoundaryPages.
//
// Deliberately requires real dot leaders, unlike LEADER_CHARS: a space-aligned
// body/table line ("Minimum learning competencies      1") otherwise reads as
// a ToC entry and silently injects fake sections whenever a body page happens
// to clear the ToC-page bar.
const BARE_TITLE_TOC_LINE = /^\s*([A-Z][A-Za-z0-9 ,'’()/&\-]{2,}?)\.{2,}\s*\d{1,4}\s*$/;
// This book also has no number at all directly on the in-body heading itself
// — the only reliable per-lesson anchor is the running page header repeated
// on every page of the lesson, "UNIT <n> — <unit title>  ...  LESSON <n>",
// which conveniently already carries both the unit AND the within-unit lesson
// number together (hand-confirmed: this exact header repeats on every page of
// grade-11 civics, so the forward search's first match is the lesson's first
// page, same as every other in-body heading match here).
const UNIT_LESSON_HEADER_LINE = /^UNIT\s+([A-Za-z0-9]+)\s*[—–-]\s*.+?LESSON\s+(\d+)\s*$/i;

// grade-11/12 chemistry (new curriculum) embed each top-level section's title
// in a custom display font whose ToUnicode mapping is broken for the specific
// glyphs it uses — pdftotext recovers the leading "1.3" numeral fine (plain
// numeral font) but the title words after it decode to raw C0 control bytes
// (hand-confirmed with `cat -A`: "1.3    ^_^^^]^\^[^Z…", not blank, not real
// text, not even the equation-like false positives titleOverlapOk normally
// guards against — see its own comment). Real body prose never contains a
// literal control byte anywhere in this book, so finding one right after a
// matching section number is itself strong, unambiguous confirmation this is
// the real heading — stronger than requiring a title match we already know is
// unrecoverable.
const HAS_CONTROL_BYTES = /[\x00-\x08\x0b\x0e-\x1f]/;

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      args[argv[i].slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  if (!args.pdf || !args.subject || !args.grade) {
    throw new Error(
      'Usage: --pdf <path> --subject <slug> --grade <n> [--curriculum new|old] [--kind textbook|teacher_guide] [--out <path>] [--allow-mismatch]'
    );
  }
  const kind = args.kind ?? 'textbook';
  if (kind !== 'textbook' && kind !== 'teacher_guide') {
    throw new Error(`--kind must be "textbook" or "teacher_guide" (got "${kind}")`);
  }
  return {
    pdf: resolve(args.pdf),
    subject: args.subject,
    grade: Number(args.grade),
    curriculum: args.curriculum ?? 'new',
    kind: kind as 'textbook' | 'teacher_guide',
    allowMismatch: args['allow-mismatch'] !== undefined,
    out: args.out,
    tocScanPages: Number(args['toc-scan-pages'] ?? 40),
  };
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

// The ToC's leader-dot run sometimes has one stray control character (0x08
// seen in grade-10 citizenship-education) wedged between the real title and
// the dots themselves — not itself a leader char (see LEADER_CHARS), so the
// lazy title capture in parseOutline ends up swallowing it into the title.
// Harmless prose-wise (only ever shows up in this ToC-adjacent position, body
// text reads clean) but would otherwise leave a literal control character
// inside a title that gets stored straight into the DB and shown in the
// reader UI.
function cleanTitle(s: string): string {
  return (
    s
      .replace(/[\x00-\x1f]+/g, '')
      // Trailing ToC leaders survive into the capture when a book uses "…"
      // ("1.2 Functions ………………") — strip dot/ellipsis runs at the end.
      .replace(/[\s.\u2026]+$/, '')
      .trim()
  );
}

// Unit ToC lines often carry their period allocation — "Unit 1: Introduction to
// Biology (15 period)". That is schedule metadata, not part of the title the
// reader groups sections under, so it is stripped here. cleanTitle runs again
// afterwards because leaders can sit between the title and that suffix.
function cleanUnitTitle(s: string): string {
  return cleanTitle(cleanTitle(s).replace(/\s*\(\s*\d+\s*periods?\s*\)\s*$/i, ''));
}

// Naive de-pluralization ("states" -> "state") — ToC wording and the actual
// section heading occasionally differ only by plural/singular (seen in the
// history book: ToC "Emergence of State" vs. heading "Emergence of States").
function stem(word: string): string {
  return word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word;
}

// The broad LEADER pattern occasionally matches a line that's actually part of
// an equation (e.g. "3.0 × 108 ms" in a physics/chemistry page), not a real
// ToC entry — a real title always has at least one real word in it.
function looksLikeTitle(title: string): boolean {
  return /[A-Za-z]{3,}/.test(title);
}

function titleOverlapOk(candidate: string, expected: string): boolean {
  const candWords = new Set(normalize(candidate).split(' ').filter((w) => w.length >= 4).map(stem));
  const expWords = normalize(expected).split(' ').filter((w) => w.length >= 4).map(stem);
  if (expWords.length === 0) return true; // very short titles ("2.1 Cells") — number match alone is enough
  const shared = expWords.filter((w) => candWords.has(w)).length;
  return shared >= Math.min(2, expWords.length);
}

// Reads ToC-region pages and returns the ordered outline (titles/order only —
// see file header for why page numbers are ignored) plus the PDF page index
// (0-based within `pages`) where ToC-like content stops.
function parseOutline(pages: string[]): { outline: Boundary[]; tocEndIdx: number } {
  const outline: Boundary[] = [];
  let tocEndIdx = -1;
  // Tracks the most recently seen Unit number, for books whose ToC numbers
  // sections "1.", "2."… resetting within each unit (see SECTION_TOC_LINE_SIMPLE)
  // rather than globally-unique "1.1"/"1.2" pairs — only meaningful as a
  // fallback once a Unit heading has actually been seen.
  let currentUnitNum: string | null = null;
  // Counts bare-title entries seen so far within the current unit, for the
  // BARE_TITLE_TOC_LINE shape where the book prints no section numbers at all.
  let bareSectionCount = 0;
  for (let i = 0; i < pages.length; i += 1) {
    const lines = pages[i].split('\n');
    // looksLikeTitle here too (not just when actually pushing a boundary below)
    // — otherwise a body page with a numbered table (e.g. grade-11 civics'
    // "1 / 2 / 3…" row-number column, each on its own line with nothing else)
    // reads as a pile of bare whitespace-then-digit "leaders" with no title
    // text at all, clears the leaderCount bar, and gets misidentified as a
    // later/false ToC page — which pushes tocEndIdx past it and silently
    // skips however much real body content sits in between as "front matter."
    const leaderCount = lines.filter((l) => LEADER.test(l) && looksLikeTitle(l)).length;
    if (leaderCount < 3) continue; // not a ToC page — a slightly higher bar since the gap pattern is broad
    tocEndIdx = i;
    for (let li = 0; li < lines.length; li += 1) {
      const line = lines[li];
      const unitMatch = line.match(UNIT_TOC_LINE);
      const endMatch = line.match(END_MARKER_TOC_LINE);
      const sectionMatch = line.match(SECTION_TOC_LINE);
      const simpleSectionMatch = line.match(SECTION_TOC_LINE_SIMPLE);
      const bareTitleMatch = line.match(BARE_TITLE_TOC_LINE);
      const bareUnitMatch = line.match(UNIT_BARE_LINE);
      if (unitMatch && looksLikeTitle(unitMatch[2])) {
        currentUnitNum = unitMatch[1];
        bareSectionCount = 0;
        outline.push({ kind: 'unit', unitNum: unitMatch[1], title: cleanUnitTitle(unitMatch[2]) });
      } else if (endMatch) {
        outline.push({ kind: 'end-marker', unitNum: endMatch[1] });
      } else if (sectionMatch && looksLikeTitle(sectionMatch[3])) {
        outline.push({
          kind: 'section',
          unitNum: sectionMatch[1],
          sectionNum: `${sectionMatch[1]}.${sectionMatch[2]}`,
          title: cleanTitle(sectionMatch[3]),
        });
      } else if (currentUnitNum !== null && simpleSectionMatch && looksLikeTitle(simpleSectionMatch[2])) {
        // See SECTION_TOC_LINE_SIMPLE — only tried once we're already inside a
        // tracked unit, and only once the real "1.1" shape above has failed to
        // match, so this can't steal a line from a book that already works.
        outline.push({
          kind: 'section',
          unitNum: currentUnitNum,
          sectionNum: `${currentUnitNum}.${simpleSectionMatch[1]}`,
          title: cleanTitle(simpleSectionMatch[2]),
        });
        bareSectionCount += 1;
      } else if (
        currentUnitNum !== null &&
        bareTitleMatch &&
        looksLikeTitle(bareTitleMatch[1]) &&
        !/^unit\b/i.test(bareTitleMatch[1])
      ) {
        // See BARE_TITLE_TOC_LINE — no printed number, so synthesize one from
        // the entry's position within the unit and match the body heading by
        // title later (matchByTitle).
        bareSectionCount += 1;
        outline.push({
          kind: 'section',
          unitNum: currentUnitNum,
          sectionNum: `${currentUnitNum}.${bareSectionCount}`,
          title: cleanTitle(bareTitleMatch[1]),
          matchByTitle: true,
        });
      } else if (bareUnitMatch) {
        // "UNIT ONE" (or "UNIT      1") on its own line, title on the next —
        // sometimes with its own trailing page number (history), sometimes
        // without one at all (economics: the title line has no leader/number,
        // the first real page number only shows up on the following "1.1" line).
        // Either way, the next non-blank line is the title; strip a trailing
        // leader+number if present, otherwise take the line as-is.
        const next = lines.slice(li + 1).find((l) => l.trim() !== '');
        if (next) {
          const title = cleanUnitTitle(next.replace(TRAILING_LEADER_NUM, ''));
          if (looksLikeTitle(title)) {
            currentUnitNum = bareUnitMatch[1];
            bareSectionCount = 0;
            outline.push({ kind: 'unit', unitNum: bareUnitMatch[1], title });
          }
        }
      }
    }
  }
  return { outline, tocEndIdx };
}

// A real in-body heading is followed by its content (objectives, prose, an
// activity) — only a *list* of headings is followed immediately by the next
// heading, with nothing in between. This catches the same per-unit mini-outline
// problem as UNIT_CONTENTS_MARKER even when a book doesn't use that literal
// wording ("Sections" instead of "Unit Contents" — seen in grade-9 biology,
// where the outline and section 1.1's real heading both fall on the same
// printed page, so skipping the whole page like UNIT_CONTENTS_MARKER does
// would discard the real content along with the list). Marks every line in a
// run of 3+ consecutive heading-shaped lines as list context, to be ignored by
// the boundary search below — a real outline lists every section in a unit
// (typically 4+), while two genuinely adjacent real headings (a short section
// immediately followed by the next) is the one case this must NOT catch;
// hand-confirmed on grade-9 mathematics, where a 2-line threshold here wrongly
// ate 2.1/2.2's real headings along with the Unit 2 boundary.
function isHeadingShaped(line: string): boolean {
  return /^(\d+)\.(\d+)\.?\s+\S/.test(line) || /^Unit\s+[A-Za-z0-9]+\b/i.test(line);
}

function markListContextLines(lines: string[]): boolean[] {
  const shaped = lines.map(isHeadingShaped);
  const skip = new Array(lines.length).fill(false);
  let runStart = -1;
  for (let i = 0; i <= lines.length; i += 1) {
    if (i < lines.length && shaped[i]) {
      if (runStart === -1) runStart = i;
    } else {
      if (runStart !== -1 && i - runStart >= 3) skip.fill(true, runStart, i);
      runStart = -1;
    }
  }
  return skip;
}

// Walks body pages sequentially looking for each outline entry's heading in
// turn. Returns a parallel array of located page numbers (1-indexed, PDF page
// numbers) — null for any boundary never found (left for manual follow-up).
function locateBoundaryPages(pages: string[], startIdx: number, outline: Boundary[]): (number | null)[] {
  const located: (number | null)[] = new Array(outline.length).fill(null);
  let searchFrom = startIdx;

  for (let bi = 0; bi < outline.length; bi += 1) {
    const boundary = outline[bi];
    let found = false;
    for (let pi = searchFrom; pi < pages.length && !found; pi += 1) {
      const lines = pages[pi].split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.some((l) => UNIT_CONTENTS_MARKER.test(l))) continue; // see UNIT_CONTENTS_MARKER
      const listContext = markListContextLines(lines);
      for (let li = 0; li < lines.length; li += 1) {
        if (listContext[li]) continue; // see markListContextLines
        const line = lines[li];

        // See UNIT_LESSON_HEADER_LINE — checked ahead of the length filter
        // below since this repeating header is long (large gap-fill
        // whitespace before "LESSON N"), unlike a real heading line.
        if (boundary.kind === 'section') {
          const unitLesson = line.match(UNIT_LESSON_HEADER_LINE);
          if (unitLesson) {
            const [, unitNum, lessonNum] = unitLesson;
            const expectedLessonNum = boundary.sectionNum.split('.')[1];
            if (unitNum.toLowerCase() === boundary.unitNum.toLowerCase() && lessonNum === expectedLessonNum) {
              located[bi] = pi + 1;
              searchFrom = pi;
              found = true;
              break;
            }
          }
        }

        if (line.length > 100) continue; // headings are short; skip body prose
        if (boundary.kind === 'unit') {
          const m = line.match(/^Unit\s+([A-Za-z0-9]+)\s*:\s*(.+)$/i);
          if (m && m[1].toLowerCase() === boundary.unitNum.toLowerCase() && titleOverlapOk(m[2], boundary.title)) {
            located[bi] = pi + 1;
            searchFrom = pi;
            found = true;
            break;
          }
        } else if (boundary.kind === 'section') {
          // See BARE_TITLE_TOC_LINE — this section has no printed number, so
          // the body heading is matched by its bare title. Digit-leading lines
          // are rejected: they are the numbered rows of the scheme-of-work /
          // contents tables, and matching those collapses a whole unit onto
          // the table's page.
          if (boundary.matchByTitle) {
            const cand = normalize(line);
            const expected = normalize(boundary.title);
            const sameTitle =
              cand === expected ||
              (cand.length >= 12 && cand.startsWith(expected)) ||
              (expected.length >= 12 && expected.startsWith(cand));
            if (sameTitle && !/^\d/.test(line) && !/\bunit\s+\w+\b/i.test(line)) {
              located[bi] = pi + 1;
              searchFrom = pi;
              found = true;
              break;
            }
            continue;
          }
          const m = line.match(/^(\d+)\.(\d+)\.?\s+(.+)$/);
          if (m && `${m[1]}.${m[2]}` === boundary.sectionNum) {
            if (titleOverlapOk(m[3], boundary.title) || HAS_CONTROL_BYTES.test(m[3])) {
              located[bi] = pi + 1;
              searchFrom = pi;
              found = true;
              break;
            }
          }
          // See BARE_SECTION_NUM: a bare "N.M" line immediately followed by a
          // "LESSON" label, title 1-2 lines further down.
          const bare = line.match(BARE_SECTION_NUM);
          if (bare && `${bare[1]}.${bare[2]}` === boundary.sectionNum && LESSON_LABEL_LINE.test(lines[li + 1] ?? '')) {
            const titleLine = lines
              .slice(li + 2, li + 5)
              .find((l) => !PURE_NUMBER_LINE.test(l) && looksLikeTitle(l));
            if (titleLine && titleOverlapOk(titleLine, boundary.title)) {
              located[bi] = pi + 1;
              searchFrom = pi;
              found = true;
              break;
            }
          }
        } else {
          const m = line.match(/^Unit\s+([A-Za-z0-9]+)\s+(?:summary|review\s+questions?)/i);
          if (m && m[1].toLowerCase() === boundary.unitNum.toLowerCase()) {
            located[bi] = pi + 1;
            searchFrom = pi;
            found = true;
            break;
          }
        }
      }
    }
  }
  return located;
}

function buildSections(outline: Boundary[], located: (number | null)[]): { sections: ManifestSection[]; unresolved: string[] } {
  const sections: ManifestSection[] = [];
  const unresolved: string[] = [];
  let currentUnitTitle = '';

  for (let i = 0; i < outline.length; i += 1) {
    const b = outline[i];
    if (b.kind === 'unit') {
      currentUnitTitle = `Unit ${b.unitNum}: ${b.title}`;
      continue;
    }
    if (b.kind !== 'section') continue;

    const pageStart = located[i];
    if (pageStart === null) {
      unresolved.push(`${b.sectionNum} ${b.title} (heading not found in body text)`);
      continue;
    }

    let pageEnd: number | null = null;
    for (let j = i + 1; j < outline.length; j += 1) {
      if (located[j] !== null) {
        pageEnd = located[j]! - 1;
        break;
      }
    }
    if (pageEnd === null || pageEnd < pageStart) {
      // Dropped, not guessed: a single-page fallback here is usually wrong (the
      // real section is almost always more than one page), and a wrong page
      // range reads as real content once it's in the reader — worse than the
      // section being absent. Same reasoning as the seed.ts comment on why an
      // empty unit beats a generic-filler one.
      unresolved.push(`${b.sectionNum} ${b.title} (no located boundary after it — dropped, not guessed)`);
      continue;
    }

    sections.push({
      // Some ToCs truncate the unit word to fit a column ("UNIT ON .... 1",
      // "UNIT THRE .... 61"), so no unit boundary parses and every section
      // would lose its unit — the reader then shows one unit per section.
      // Fall back to the section's own number so grouping survives; a parsed
      // unit title always wins.
      unitTitle: currentUnitTitle || `Unit ${b.sectionNum.split('.')[0]}`,
      sectionTitle: `${b.sectionNum} ${b.title}`,
      pageStart,
      pageEnd,
    });
  }
  return { sections, unresolved };
}

function deriveKnownHeaders(
  pages: string[],
  tocEndIdx: number,
  pageCount: number,
  kind: 'textbook' | 'teacher_guide' = 'textbook'
): string[] {
  // The running "<SUBJECT> GRADE <N>" token repeats on every body page, but a
  // single sampled page's first line can just as easily be a one-off unit
  // divider ("Unit One: Biology and technology") that happens to satisfy the
  // same shape check — hand-confirmed this misfire on grade-11 biology,
  // where it picked the divider instead of "BIOLOGY GRADE 11" because that's
  // literally the only line on that particular page. Requiring the same
  // first-column token to appear on at least 2 of several sampled pages
  // confirms it's actually a repeating header, not a one-off heading.
  const counts = new Map<string, number>();
  for (let i = tocEndIdx + 1; i < Math.min(tocEndIdx + 30, pageCount); i += 1) {
    const firstLine = pages[i]?.split('\n').find((l) => l.trim().length > 0);
    if (!firstLine) continue;
    // Header lines are "<TITLE TOKEN>   <STUDENT TEXTBOOK|other>" — big gap between columns.
    const parts = firstLine.split(/\s{2,}/).map((p) => p.trim()).filter(Boolean);
    const token = parts[0];
    if (token && token.length > 3 && token.length < 40 && !/^\d+\.\d/.test(token)) {
      counts.set(token.toUpperCase(), (counts.get(token.toUpperCase()) ?? 0) + 1);
    }
  }
  const bookLabel = kind === 'teacher_guide' ? 'TEACHER GUIDE' : 'STUDENT TEXTBOOK';
  for (const [token, count] of counts) {
    if (count >= 2) return [token, bookLabel];
  }
  return [bookLabel];
}

// Significant-word set for a section title — numbers and short words dropped,
// so "1.4 Tools of a Biologist" and "Tools of a Biologist" compare equal.
function titleWordSet(s: string): Set<string> {
  return new Set(
    normalize(s)
      .split(' ')
      .filter((w) => w.length >= 4 && !/^\d+$/.test(w))
      .map(stem)
  );
}

// Fraction of `candidates` whose significant words share at least two words
// with some reference title (all of them, for very short titles). Used to
// catch a teacher guide that is the wrong curriculum/edition for the student
// book it is about to sit beside.
function titleOverlapRatio(reference: string[], candidates: string[]): number {
  const refSets = reference.map(titleWordSet).filter((s) => s.size > 0);
  if (refSets.length === 0 || candidates.length === 0) return 1;
  let hits = 0;
  for (const title of candidates) {
    const words = [...titleWordSet(title)];
    if (words.length === 0) continue;
    const needed = Math.min(2, words.length);
    if (refSets.some((set) => words.filter((w) => set.has(w)).length >= needed)) hits += 1;
  }
  return hits / candidates.length;
}

async function main() {
  const { pdf, subject, grade, curriculum, kind, allowMismatch, out, tocScanPages } = parseArgs(
    process.argv.slice(2)
  );
  const pageCount = await pdfPageCount(pdf);
  const scanCount = Math.min(tocScanPages, pageCount);
  const rawFront = await pdfPageText(pdf, 1, scanCount);
  const frontPages = rawFront.split('\f');

  const { outline, tocEndIdx } = parseOutline(frontPages);
  if (outline.filter((b) => b.kind === 'section').length === 0) {
    throw new Error(`No ToC section entries found in the first ${scanCount} pages — ToC may start later; retry with --toc-scan-pages`);
  }
  if (tocEndIdx < 0) throw new Error('Could not find a ToC-like page in the scanned range');

  // Extract the rest of the book in one call — pdftotext appends a trailing
  // form-feed after the last requested page, so splitting on '\f' yields one
  // extra empty element at the end of every call; chunking would silently
  // inject a phantom page at each chunk boundary and cascade a 1-page drift
  // through every section after it. Slicing to the expected count avoids that.
  const bodyPages: string[] = frontPages.slice(0, tocEndIdx + 1);
  if (tocEndIdx + 2 <= pageCount) {
    const rest = await pdfPageText(pdf, tocEndIdx + 2, pageCount);
    const expectedCount = pageCount - (tocEndIdx + 2) + 1;
    bodyPages.push(...rest.split('\f').slice(0, expectedCount));
  }

  const located = locateBoundaryPages(bodyPages, tocEndIdx + 1, outline);
  const { sections, unresolved } = buildSections(outline, located);
  const knownHeaders = deriveKnownHeaders(bodyPages, tocEndIdx, bodyPages.length, kind);

  const backendRoot = resolve(__dirname, '../..');
  const relPath = relative(backendRoot, pdf);
  // Keep the given shape (assets/books/…, assets/teacher-guides/…) instead of
  // forcing every source under assets/books/ — teacher guides live elsewhere.
  const pdfPath = relPath.startsWith('..') ? `assets/books/${basename(pdf)}` : relPath.replace(/\\/g, '/');

  // A teacher guide must actually belong to the student book it will sit next
  // to: two editions of "Grade 9 Biology" can be different curricula entirely,
  // and the mismatch is invisible once imported. Compare section titles.
  if (kind === 'teacher_guide' && !allowMismatch) {
    // Subject slugs are not consistent across the existing manifests (civics vs
    // citizenship-education, english vs english-for-ethiopia, …), and some
    // grades only have an -old edition on disk. Try every spelling and pass if
    // ANY of them looks like the same book.
    const aliases: Record<string, string[]> = {
      civics: ['civics', 'citizenship-education'],
      'citizenship-education': ['citizenship-education', 'civics'],
      'information-technology': ['information-technology', 'information-communication-technology-ict'],
      'information-communication-technology-ict': ['information-communication-technology-ict', 'information-technology'],
      english: ['english', 'english-for-ethiopia'],
      'english-for-ethiopia': ['english-for-ethiopia', 'english'],
      mathematics: ['mathematics', 'maths', 'math'],
      hpe: ['hpe', 'health-and-physical-education'],
      'health-and-physical-education': ['health-and-physical-education', 'hpe'],
    };
    const names = aliases[subject] ?? [subject];
    const candidates = [...new Set(names.flatMap((n) => [`${n}-g${grade}.json`, `${n}-g${grade}-old.json`]))]
      .map((f) => resolve(__dirname, 'manifests', f))
      .filter((p) => existsSync(p));

    let best: { file: string; overlap: number; pdfPath?: string } | null = null;
    for (const candidate of candidates) {
      const student = JSON.parse(await readFile(candidate, 'utf-8')) as {
        pdfPath?: string;
        sections?: ManifestSection[];
      };
      const studentTitles = (student.sections ?? []).map((s) => s.sectionTitle);
      const overlap = titleOverlapRatio(
        studentTitles,
        sections.map((s) => s.sectionTitle)
      );
      if (!best || overlap > best.overlap) {
        best = { file: candidate.split('/').pop()!, overlap, pdfPath: student.pdfPath };
      }
    }

    if (best) {
      // Measured on grade-9 biology: the correct new-curriculum companion scores
      // 84%, the old-curriculum edition 31% — 50% separates them without
      // requiring an exact unit-for-unit match (wording differs between books).
      if (best.overlap < 0.5) {
        throw new Error(
          `This teacher guide does not look like the companion to ${best.file} — ` +
            `only ${(best.overlap * 100).toFixed(0)}% of its section titles overlap, so it is probably a different ` +
            `curriculum or edition.\n` +
            `  teacher guide: ${pdfPath}\n` +
            `  student book:  ${best.pdfPath ?? 'unknown'}\n` +
            `  Pass --allow-mismatch if you are certain this is the right pairing.`
        );
      }
      console.log(
        `Curriculum check: ${(best.overlap * 100).toFixed(0)}% section-title overlap with ${best.file}.`
      );
    } else {
      console.log('Curriculum check: skipped — no student manifest for this subject/grade to compare against.');
    }
  }

  const manifest = {
    subject,
    grade,
    curriculum,
    kind,
    pdfPath,
    sections,
    knownHeaders,
  };

  const kindSuffix = kind === 'teacher_guide' ? '-teacher-guide' : '';
  const outPath = out
    ? resolve(out)
    : resolve(__dirname, `manifests/${subject}-g${grade}${kindSuffix}${curriculum === 'old' ? '-old' : ''}.json`);
  await writeFile(outPath, JSON.stringify(manifest, null, 2));

  console.log(`Wrote ${sections.length} section(s) to ${outPath}`);
  if (unresolved.length > 0) {
    console.log(`\n${unresolved.length} unresolved boundary(ies) — spot-check before running ingest:textbook:`);
    unresolved.forEach((u) => console.log(`  - ${u}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
