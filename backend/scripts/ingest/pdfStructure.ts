// Wraps poppler's `pdftohtml -xml`, which — unlike `pdftotext -bbox-layout`
// (this module's previous approach, kept in git history) — exposes text
// STYLE (bold, font family, color) alongside position. That extra signal
// matters: distinguishing a real heading from a bold callout-box label
// ("Self-questioning") from a bold inline term ("Profit Motive: ...") is
// fundamentally ambiguous from position/size alone (hand-confirmed this
// session — multiple heuristics needed to patch position-only false
// positives), but trivial once you know which runs are actually bold and
// which font/color they use. `-bbox-layout` doesn't expose any of that.
//
// Trade-off: `-xml` has no <flow>/<block>/<line> grouping at all (just a
// flat list of <text> runs per page, in PDF-content-stream order, which is
// often NOT reading order) and groups by matching-font runs rather than by
// word — coarser than `-bbox-layout`'s per-word breakdown, but each run is
// usually already a full visual line for uniform-style text (confirmed by
// hand), and a style change (e.g. a bullet glyph in a different font) reliably
// starts a new run — which is actually the signal classifyBlocks.ts needs
// for bullet detection anyway.
//
// No new dependency: pdftohtml ships with the same poppler-utils install as
// pdftotext/pdfinfo. `-i` is required — without it, pdftohtml additionally
// dumps every embedded image (including this book's ~9000 decorative
// watermark tiles) to loose PNG files next to the source PDF as a side
// effect of XML export; confirmed removing that flag litters assets/books/.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export type TextRun = {
  text: string;
  bold: boolean;
  fontFamily: string;
  fontSize: number;
  color: string;
  top: number;
  left: number;
  width: number;
  height: number;
};
export type PageStructure = { pageNum: number; width: number; height: number; runs: TextRun[] };

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, '&'); // last — must not re-decode entities produced by the others
}

function attrNum(tag: string, name: string): number {
  const m = tag.match(new RegExp(`${name}="([-\\d.]+)"`));
  return m ? Number(m[1]) : 0;
}

function attrStr(tag: string, name: string): string {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : '';
}

type FontSpec = { size: number; family: string; color: string };

function parseFontSpecs(pageXml: string): Map<string, FontSpec> {
  const specs = new Map<string, FontSpec>();
  const re = /<fontspec id="([^"]*)"([^/]*)\/>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(pageXml))) {
    const [, id, attrs] = m;
    specs.set(id, { size: attrNum(attrs, 'size'), family: attrStr(attrs, 'family'), color: attrStr(attrs, 'color') });
  }
  return specs;
}

function parseRuns(pageXml: string, fonts: Map<string, FontSpec>): TextRun[] {
  const runs: TextRun[] = [];
  const re = /<text top="([-\d.]+)" left="([-\d.]+)" width="([-\d.]+)" height="([-\d.]+)" font="([^"]*)">([\s\S]*?)<\/text>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(pageXml))) {
    const [, top, left, width, height, fontId, rawInner] = m;
    const bold = /<b>/.test(rawInner);
    // A source PDF hyperlink (a citation, a "read more" reference) comes
    // through as an actual <a href="..."> wrapping the link text — hand-
    // confirmed leaking straight into the reader as literal visible markup
    // ("<a href=\"...\">Motion in a Straight Line</a>") on a physics page.
    // Strips the tag, keeps the link's visible text.
    const text = decodeEntities(rawInner.replace(/<a\b[^>]*>|<\/a>/g, '').replace(/<\/?[bi]>/g, ''));
    const font = fonts.get(fontId);
    runs.push({
      text,
      bold: bold || /,\s*Bold/i.test(font?.family ?? ''),
      fontFamily: font?.family ?? '',
      fontSize: font?.size ?? 0,
      color: font?.color ?? '',
      top: Number(top),
      left: Number(left),
      width: Number(width),
      height: Number(height),
    });
  }
  return runs;
}

// Fetches structure for pages [firstPage, lastPage] (1-indexed, inclusive) in
// a single pdftohtml invocation — batched at the caller's page-range
// granularity, not per-page, to avoid the N-subprocess-calls performance
// trap already hit once this session (see imageExtract.ts's header comment).
export async function pdfPageStructure(pdfPath: string, firstPage: number, lastPage: number): Promise<PageStructure[]> {
  const { stdout } = await execFileAsync(
    'pdftohtml',
    ['-xml', '-f', String(firstPage), '-l', String(lastPage), '-stdout', '-i', pdfPath],
    { maxBuffer: 50 * 1024 * 1024 }
  );

  const pages: PageStructure[] = [];
  const pageRe = /<page number="(\d+)"[^>]*height="([-\d.]+)" width="([-\d.]+)">([\s\S]*?)<\/page>/g;
  let m: RegExpExecArray | null;
  while ((m = pageRe.exec(stdout))) {
    const [, pageNum, height, width, inner] = m;
    const fonts = parseFontSpecs(inner);
    pages.push({ pageNum: Number(pageNum), width: Number(width), height: Number(height), runs: parseRuns(inner, fonts) });
  }
  return pages;
}
