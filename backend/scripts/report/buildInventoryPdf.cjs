// Renders the question inventory report to PDF.
//
//   node backend/scripts/report/buildInventoryPdf.cjs
//
// Input : docs/question-inventory-full-table.md (308-row grid)
//         docs/question-inventory.md            (totals + gaps sections)
// Output: docs/question-inventory.pdf
//
// No database access — it only reformats the two generated documents. Re-run
// the generators first if the numbers are stale.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const REPO = path.resolve(__dirname, '../../..');
const FULL = path.join(REPO, 'docs/question-inventory-full-table.md');
const MAIN = path.join(REPO, 'docs/question-inventory.md');
const OUT = path.join(REPO, 'docs/question-inventory.pdf');

for (const f of [FULL, MAIN]) {
  if (!fs.existsSync(f)) throw new Error(`missing input: ${path.relative(REPO, f)}`);
}

const full = fs.readFileSync(FULL, 'utf8');
const main = fs.readFileSync(MAIN, 'utf8');

function section(md, heading) {
  const start = md.indexOf(heading);
  if (start < 0) return '';
  const next = md.indexOf('\n## ', start + heading.length);
  return md.slice(start, next < 0 ? undefined : next).trim();
}

const totals = section(main, '## Totals');
const gaps = section(main, '## Gaps');
const method = section(main, '## Method and limits');

// The full-table document already carries the grid; drop its own H1 so the
// report has a single title, and keep its practice-bank note.
const grid = full.replace(/^# .*\n/, '').trim();

const legend = `**Reading the Source column**

- \`national-exams PDF (questions + key)\` — the paper and a separate answer-key file are held in \`EUEE_database/\`.
- \`temari PDF (questions only, no key file)\` — the paper is held; no key file is held for it.
- \`+ page scans\` — scanned page images of the same paper are also held.
- \`UNKNOWN — rows exist, no paper in library\` — questions exist in the database but no source file does.
- \`— not in library\` — no questions and no file.
- \`· same paper stored in both streams\` — one paper shown under both streams; the two rows must not be summed.

**A note on verification** — the Source column records whether a paper file exists, not whether the rows were checked against it. No question-by-question verification against the PDFs has been performed, and the database holds no per-question source field.`;

const doc = `---
title: "UEE Question Inventory — 2004 to 2025"
subtitle: "Every examination year, stream and subject, with answer and explanation coverage"
date: "${new Date().toISOString().slice(0, 10)}"
---

${legend}

${grid}

${totals}

${gaps}

${method}
`;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uee-inv-pdf-'));
const mdPath = path.join(tmp, 'report.md');
const cssPath = path.join(tmp, 'report.css');
const htmlPath = path.join(tmp, 'report.html');
fs.writeFileSync(mdPath, doc);

fs.writeFileSync(cssPath, `
@page { size: A4 landscape; margin: 14mm 10mm 16mm 10mm; }
body { font-family: "DejaVu Sans", Arial, sans-serif; font-size: 9pt; color: #111; margin: 0; }
h1.title { font-size: 20pt; margin: 0 0 2mm 0; border: 0; }
p.subtitle { font-size: 11pt; color: #444; margin: 0 0 1mm 0; }
p.date { font-size: 10pt; color: #666; margin: 0 0 6mm 0; }
h1, h2, h3 { border-bottom: 1px solid #ccc; padding-bottom: 1mm; margin: 6mm 0 3mm 0; page-break-after: avoid; }
table { width: 100%; border-collapse: collapse; font-size: 7.4pt; margin: 3mm 0 6mm 0; }
thead { display: table-header-group; }
th { background: #e8e8e8; font-weight: 600; }
th, td { border: 0.4pt solid #999; padding: 1.2pt 2.5pt; line-height: 1.15; }
td:nth-child(1) { text-align: left; padding-left: 4pt; }
td:nth-child(2) { padding-left: 5pt; }
td:nth-child(4), td:nth-child(5), td:nth-child(6),
td:nth-child(7), td:nth-child(8) { text-align: right; white-space: nowrap; }
td:nth-child(1) { white-space: nowrap; }
td:nth-child(3) { white-space: nowrap; }
tbody tr:nth-child(even) { background: #f6f6f6; }
tr { page-break-inside: avoid; }
ul, ol { margin: 2mm 0 4mm 0; }
li { margin: 0.8mm 0; }
code { font-size: 8pt; }
`);

// pandoc markdown -> standalone HTML with the CSS embedded
execFileSync('pandoc', [
  mdPath, '-o', htmlPath,
  '--standalone', '--embed-resources',
  '--css', cssPath,
  '--metadata', 'pagetitle=UEE Question Inventory',
], { stdio: 'inherit' });

(async () => {
  const { chromium } = require(path.join(REPO, 'backend/node_modules/playwright'));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'load' });
  await page.pdf({
    path: OUT,
    format: 'A4',
    landscape: true,
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size:7pt;color:#888;width:100%;padding:0 10mm;">UEE Question Inventory — 2004–2025</div>',
    footerTemplate: '<div style="font-size:7pt;color:#888;width:100%;padding:0 10mm;text-align:right;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
    margin: { top: '16mm', bottom: '14mm', left: '10mm', right: '10mm' },
  });
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(path.relative(REPO, OUT));
})();
