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
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pdfPageCount, pdfPageText } from './pdfText';

type Boundary =
  | { kind: 'unit'; unitNum: string; title: string }
  | { kind: 'section'; unitNum: string; sectionNum: string; title: string }
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
const LEADER_CHARS = '\\s.\\-_\\uFFFD\\uE000-\\uF8FF';
const LEADER = new RegExp(`[${LEADER_CHARS}]{2,}\\d{1,4}\\s*$`);
const UNIT_TOC_LINE = new RegExp(`^\\s*Unit\\s+([A-Za-z0-9]+)\\s*:\\s*(.+?)[${LEADER_CHARS}]{2,}\\d{1,4}\\s*$`, 'i');
const UNIT_BARE_LINE = /^\s*UNIT\s+([A-Za-z0-9]+)\s*:?\s*$/i;
const TRAILING_LEADER_NUM = new RegExp(`[${LEADER_CHARS}]{2,}\\d{1,4}\\s*$`);
const SECTION_TOC_LINE = new RegExp(`^\\s*(\\d+)\\.(\\d+)\\.?\\s+(.+?)[${LEADER_CHARS}]{2,}\\d{1,4}\\s*$`);
const END_MARKER_TOC_LINE = new RegExp(
  `^\\s*Unit\\s+([A-Za-z0-9]+)\\s+(?:summary|review\\s+questions?)\\b.*[${LEADER_CHARS}]{2,}\\d{1,4}\\s*$`,
  'i'
);

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      args[argv[i].slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  if (!args.pdf || !args.subject || !args.grade) {
    throw new Error('Usage: --pdf <path> --subject <slug> --grade <n> [--curriculum new|old] [--out <path>]');
  }
  return {
    pdf: resolve(args.pdf),
    subject: args.subject,
    grade: Number(args.grade),
    curriculum: args.curriculum ?? 'new',
    out: args.out,
    tocScanPages: Number(args['toc-scan-pages'] ?? 40),
  };
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
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
  for (let i = 0; i < pages.length; i += 1) {
    const lines = pages[i].split('\n');
    const leaderCount = lines.filter((l) => LEADER.test(l)).length;
    if (leaderCount < 3) continue; // not a ToC page — a slightly higher bar since the gap pattern is broad
    tocEndIdx = i;
    for (let li = 0; li < lines.length; li += 1) {
      const line = lines[li];
      const unitMatch = line.match(UNIT_TOC_LINE);
      const endMatch = line.match(END_MARKER_TOC_LINE);
      const sectionMatch = line.match(SECTION_TOC_LINE);
      const bareUnitMatch = line.match(UNIT_BARE_LINE);
      if (unitMatch && looksLikeTitle(unitMatch[2])) {
        outline.push({ kind: 'unit', unitNum: unitMatch[1], title: unitMatch[2].trim() });
      } else if (endMatch) {
        outline.push({ kind: 'end-marker', unitNum: endMatch[1] });
      } else if (sectionMatch && looksLikeTitle(sectionMatch[3])) {
        outline.push({
          kind: 'section',
          unitNum: sectionMatch[1],
          sectionNum: `${sectionMatch[1]}.${sectionMatch[2]}`,
          title: sectionMatch[3].trim(),
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
          const title = next.replace(TRAILING_LEADER_NUM, '').trim();
          if (looksLikeTitle(title)) outline.push({ kind: 'unit', unitNum: bareUnitMatch[1], title });
        }
      }
    }
  }
  return { outline, tocEndIdx };
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
      for (const line of lines) {
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
          const m = line.match(/^(\d+)\.(\d+)\.?\s+(.+)$/);
          if (m && `${m[1]}.${m[2]}` === boundary.sectionNum && titleOverlapOk(m[3], boundary.title)) {
            located[bi] = pi + 1;
            searchFrom = pi;
            found = true;
            break;
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
      unresolved.push(`${b.sectionNum} ${b.title} (no located boundary after it — using single-page fallback)`);
      pageEnd = pageStart;
    }

    sections.push({
      unitTitle: currentUnitTitle,
      sectionTitle: `${b.sectionNum} ${b.title}`,
      pageStart,
      pageEnd,
    });
  }
  return { sections, unresolved };
}

function deriveKnownHeaders(pages: string[], tocEndIdx: number, pageCount: number): string[] {
  // Sample a body page's header line (first non-blank line) for the running
  // "<SUBJECT> GRADE <N>" token that prefixes every page.
  for (let i = tocEndIdx + 1; i < Math.min(tocEndIdx + 20, pageCount); i += 1) {
    const firstLine = pages[i]?.split('\n').find((l) => l.trim().length > 0);
    if (!firstLine) continue;
    // Header lines are "<TITLE TOKEN>   <STUDENT TEXTBOOK|other>" — big gap between columns.
    const parts = firstLine.split(/\s{2,}/).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0 && parts[0].length > 3 && parts[0].length < 40 && !/^\d+\.\d/.test(parts[0])) {
      return [parts[0].toUpperCase(), 'STUDENT TEXTBOOK'];
    }
  }
  return ['STUDENT TEXTBOOK'];
}

async function main() {
  const { pdf, subject, grade, curriculum, out, tocScanPages } = parseArgs(process.argv.slice(2));
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
  const knownHeaders = deriveKnownHeaders(bodyPages, tocEndIdx, bodyPages.length);

  const manifest = {
    subject,
    grade,
    curriculum,
    pdfPath: `assets/books/${pdf.split('/').pop()}`,
    sections,
    knownHeaders,
  };

  const outPath = out
    ? resolve(out)
    : resolve(__dirname, `manifests/${subject}-g${grade}${curriculum === 'old' ? '-old' : ''}.json`);
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
