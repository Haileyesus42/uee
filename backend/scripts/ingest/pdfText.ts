// Thin wrappers around poppler-utils (pdftotext/pdfinfo), which are already
// installed on this machine. Used instead of vision/OCR for source PDFs that
// already have a real text layer — cheaper, faster, and zero transcription risk
// compared to sending page images to a vision model.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function pdfPageCount(path: string): Promise<number> {
  const { stdout } = await execFileAsync('pdfinfo', [path]);
  const match = stdout.match(/^Pages:\s+(\d+)/m);
  if (!match) throw new Error(`Couldn't read page count from pdfinfo output for ${path}`);
  return Number(match[1]);
}

// Extracts text for pages [firstPage, lastPage] (1-indexed, inclusive). Omit
// lastPage to extract to the end of the document. `layout` defaults to true
// (preserves column alignment — needed for the exam parser's A./B./C./D. option
// detection). Also the right default for the textbook-reader pipeline: hand-tested
// both modes against this book's 2-column pages — plain (non-layout) mode
// scrambles body text word-by-word wherever a page has 2 columns (unreadable),
// while -layout keeps ordinary paragraph text coherent and only has a narrower
// defect (a sidebar phrase occasionally interleaved into an adjacent sentence —
// see textCleanup.ts for exactly where/why).
export async function pdfPageText(
  path: string,
  firstPage: number,
  lastPage?: number,
  layout = true
): Promise<string> {
  const args = ['-f', String(firstPage), '-l', String(lastPage ?? firstPage)];
  if (layout) args.push('-layout');
  args.push(path, '-');
  const { stdout } = await execFileAsync('pdftotext', args, { maxBuffer: 20 * 1024 * 1024 });
  return stdout;
}
