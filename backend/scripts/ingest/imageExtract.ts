// Extracts real content figures (not decorative page furniture) from a PDF,
// using poppler's pdfimages. This book's pages carry a repeating decorative
// floral watermark as ~35 tiled indexed-color image objects per page (confirmed
// by hand — same object ID reused throughout, low-quality indexed color) —
// naively extracting "every embedded image" would pull in that noise. Real
// content photos in this book are JPEG-encoded and reasonably sized; watermark
// tiles and small decorative icons are not. Filtering on encoding + a minimum
// size threshold reliably separates the two (confirmed by hand against real
// figures vs. the watermark).
//
// Extraction runs ONCE per PDF (memoized), not once per page: `pdfimages -png`
// forces every embedded image — including thousands of discarded watermark
// tiles — through full PNG re-encoding, and doing that per page (re-opening
// the whole PDF each call) measured at ~9s/page on a 294-page book, i.e.
// nearly 45 minutes for one book. `pdfimages -j` (raw JPEG passthrough, no
// re-encoding — the kept images are jpeg-encoded already, see the filter
// below) run once for the whole document measured at ~80s for that same
// book, an ~30x improvement, and scales as O(1) pdfimages invocations per
// book instead of O(pages).
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const execFileAsync = promisify(execFile);

type ImageRow = { globalIndex: number; page: number; num: number; width: number; height: number; enc: string };

const MIN_WIDTH = 100;
const MIN_HEIGHT = 80;

// `pdfimages -list` columns (fixed order, confirmed against real output):
// page num type width height color comp bpc enc interp object gen x-ppi y-ppi size ratio
// globalIndex is this row's position in the listing — confirmed by hand to
// line up exactly with the Nth file `pdfimages -j` (no -f/-l) produces for
// the whole document (same traversal order), which is how extracted files
// get matched back to the page/dimensions they belong to.
async function listBookImages(pdfPath: string): Promise<ImageRow[]> {
  const { stdout } = await execFileAsync('pdfimages', ['-list', pdfPath], { maxBuffer: 50 * 1024 * 1024 });
  const lines = stdout.split('\n').slice(2); // skip header + "----" separator
  const rows: ImageRow[] = [];
  let globalIndex = 0;
  for (const line of lines) {
    const cols = line.trim().split(/\s+/);
    if (cols.length < 9) continue;
    const page = Number(cols[0]);
    const num = Number(cols[1]);
    const width = Number(cols[3]);
    const height = Number(cols[4]);
    const enc = cols[8];
    if (Number.isNaN(page) || Number.isNaN(num) || Number.isNaN(width) || Number.isNaN(height)) continue;
    rows.push({ globalIndex, page, num, width, height, enc });
    globalIndex += 1;
  }
  return rows;
}

type BookExtraction = { rows: ImageRow[]; tmpDir: string };

const bookCache = new Map<string, Promise<BookExtraction>>();

async function ensureBookExtracted(pdfPath: string): Promise<BookExtraction> {
  let cached = bookCache.get(pdfPath);
  if (!cached) {
    cached = (async () => {
      const rows = await listBookImages(pdfPath);
      const tmpDir = join(tmpdir(), `uee-imgextract-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      await mkdir(tmpDir, { recursive: true });
      // -j: JPEG-encoded images are copied as-is (fast); everything else falls
      // back to .ppm. Every image this module keeps is jpeg-encoded (filter
      // below), so the .ppm files are only ever the discarded watermark/icon
      // noise and are never read.
      await execFileAsync('pdfimages', ['-j', pdfPath, join(tmpDir, 'img')], { maxBuffer: 50 * 1024 * 1024 });
      return { rows, tmpDir };
    })();
    bookCache.set(pdfPath, cached);
  }
  return cached;
}

// Extracts one page's real content figures into outDir, named
// "<filePrefix>-p<page>-<num>.jpg". Draws from the whole-book extraction
// (see ensureBookExtracted) rather than re-invoking pdfimages per page.
export async function extractContentFigures(
  pdfPath: string,
  page: number,
  outDir: string,
  filePrefix: string
): Promise<{ filename: string; width: number; height: number }[]> {
  const { rows, tmpDir } = await ensureBookExtracted(pdfPath);
  const keep = rows.filter(
    (r) => r.page === page && r.enc === 'jpeg' && r.width >= MIN_WIDTH && r.height >= MIN_HEIGHT
  );

  await mkdir(outDir, { recursive: true });
  const results: { filename: string; width: number; height: number }[] = [];
  for (const row of keep) {
    const globalNum = String(row.globalIndex).padStart(3, '0');
    const src = join(tmpDir, `img-${globalNum}.jpg`);
    const num = String(row.num).padStart(3, '0');
    const filename = `${filePrefix}-p${page}-${num}.jpg`;
    try {
      await copyFile(src, join(outDir, filename));
      results.push({ filename, width: row.width, height: row.height });
    } catch {
      // pdfimages occasionally skips an object it can't decode — skip gracefully.
    }
  }
  return results;
}

// Call once after finishing all sections for a book — deletes that book's
// whole-document temp extraction (thousands of discarded .ppm/.jpg files).
export async function cleanupBookImages(pdfPath: string): Promise<void> {
  const cached = bookCache.get(pdfPath);
  if (!cached) return;
  bookCache.delete(pdfPath);
  const { tmpDir } = await cached;
  await rm(tmpDir, { recursive: true, force: true });
}
