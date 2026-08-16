// Crawls kehulum.com's grade 9-12 student-textbook listing pages (new + old
// curriculum) and downloads each subject's PDF into assets/books/, using the
// filename the server serves it under (already grade/subject/curriculum-
// qualified, e.g. "grade-11-biology-new-curriculum--student-textbook-
// kehulumcom<id>.pdf") so it drops straight into the same flat layout the one
// manually-downloaded book already lives in, and that manifests/*.json's
// pdfPath points at.
//
// robots.txt has no disallow rules (checked 2026-08-16), but this still paces
// requests ~1s apart and skips files already on disk, so re-runs are cheap.
//
// Usage:
//   npm run ingest:download -- --dry-run
//   npm run ingest:download -- --curricula new --grades 11,12
//   npm run ingest:download            # defaults to both curricula, grades 9-12
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const BASE = 'https://kehulum.com';
const USER_AGENT = 'Mozilla/5.0 (compatible; uee-textbook-ingest/1.0; personal educational use)';
const REQUEST_DELAY_MS = 1000;
const OUT_DIR = resolve(__dirname, '../../assets/books');
const LOG_PATH = resolve(OUT_DIR, '_download-log.json');

type Curriculum = 'new' | 'old';

type BookResult = {
  curriculum: Curriculum;
  grade: number;
  subjectSlug: string;
  subjectUrl: string;
  pdfUrl?: string;
  filename?: string;
  status: 'downloaded' | 'skipped-exists' | 'no-pdf-found' | 'failed' | 'would-download';
  error?: string;
};

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      const next = argv[i + 1];
      args[argv[i].slice(2)] = next && !next.startsWith('--') ? next : 'true';
      if (next && !next.startsWith('--')) i += 1;
    }
  }
  return {
    curricula: (args.curricula ?? 'new,old').split(',') as Curriculum[],
    grades: (args.grades ?? '9,10,11,12').split(',').map(Number),
    dryRun: args['dry-run'] === 'true',
  };
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.text();
}

// Listing pages link to each subject as /student-textbook/{curriculum}/grade-{n}/{slug}
function extractSubjectLinks(html: string, curriculum: Curriculum, grade: number): string[] {
  const prefix = `/student-textbook/${curriculum}/grade-${grade}/`;
  const pattern = new RegExp(`href=["'](?:https?://kehulum\\.com)?(${prefix}[a-z0-9-]+)["']`, 'gi');
  const slugs = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html))) slugs.add(match[1]);
  return [...slugs];
}

// Each detail page has exactly one PDF link, so a single match is safe (no
// risk of grabbing a "related books" link instead) — but the asset path
// prefix isn't consistent (seen both /bfile_asset/... and /books_asset/...
// across pages), so match any .pdf under the domain rather than one prefix.
function extractPdfUrl(html: string): string | undefined {
  const match = html.match(/href=["'](https:\/\/kehulum\.com\/[^"']+\.pdf)["']/i);
  return match?.[1];
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function downloadPdf(url: string, destPath: string): Promise<void> {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buffer);
}

async function main() {
  const { curricula, grades, dryRun } = parseArgs(process.argv.slice(2));
  await mkdir(OUT_DIR, { recursive: true });

  const results: BookResult[] = [];

  for (const curriculum of curricula) {
    for (const grade of grades) {
      const listingUrl = `${BASE}/student-textbook/${curriculum}/grade-${grade}`;
      let html: string;
      try {
        html = await fetchHtml(listingUrl);
      } catch (err) {
        console.error(`[listing] ${listingUrl}: ${(err as Error).message}`);
        continue;
      }
      await sleep(REQUEST_DELAY_MS);

      const subjectPaths = extractSubjectLinks(html, curriculum, grade);
      if (subjectPaths.length === 0) {
        console.warn(`[listing] ${listingUrl}: no subject links found`);
      }

      for (const path of subjectPaths) {
        const subjectUrl = `${BASE}${path}`;
        const subjectSlug = path.split('/').pop()!;
        const result: BookResult = { curriculum, grade, subjectSlug, subjectUrl, status: 'failed' };

        try {
          const detailHtml = await fetchHtml(subjectUrl);
          await sleep(REQUEST_DELAY_MS);

          const pdfUrl = extractPdfUrl(detailHtml);
          if (!pdfUrl) {
            result.status = 'no-pdf-found';
            results.push(result);
            console.warn(`[no-pdf] ${subjectUrl}`);
            continue;
          }
          result.pdfUrl = pdfUrl;
          const filename = decodeURIComponent(pdfUrl.split('/').pop()!);
          result.filename = filename;
          const destPath = resolve(OUT_DIR, filename);

          if (dryRun) {
            result.status = 'would-download';
            results.push(result);
            console.log(`[dry-run] ${curriculum}/grade-${grade}/${subjectSlug} -> ${filename}`);
            continue;
          }

          if (await fileExists(destPath)) {
            result.status = 'skipped-exists';
            results.push(result);
            console.log(`[skip] ${filename} already on disk`);
            continue;
          }

          await downloadPdf(pdfUrl, destPath);
          await sleep(REQUEST_DELAY_MS);
          result.status = 'downloaded';
          results.push(result);
          console.log(`[done] ${filename}`);
        } catch (err) {
          result.status = 'failed';
          result.error = (err as Error).message;
          results.push(result);
          console.error(`[failed] ${subjectUrl}: ${result.error}`);
        }
      }
    }
  }

  await writeFile(LOG_PATH, JSON.stringify(results, null, 2));

  const counts = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  console.log('\nSummary:', counts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
