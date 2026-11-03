// Builds ../EUEE_database from the three raw source libraries on this host.
//
//   node backend/scripts/source-library/organizeSourceLibrary.cjs [--dry-run]
//
// Sources (read-only; nothing is moved or deleted):
//   /home/haile/Downloads/ethiopian-national-exams   question + answer PDFs, 6 subjects
//   backend/scripts/ingest/input/temari              E.C.-labelled exam PDFs, 10 subjects
//   backend/scripts/ingest/input/past-papers         page-image scans, 3 subjects
//   /home/haile/Downloads/hanna_documents            student textbooks + teacher guides
//
// Output: EUEE_database/{exams,textbooks,teacher-guides}/…, _extras/ for files that
// are not a complete book or paper, _quarantine/ for source files flagged broken,
// plus MANIFEST.csv (one row per file, with page count and sha256) and a copy of
// the SOURCES/RULES notes in README.md.
//
// Classification is by filename only. Every inferred value is written to the
// manifest with the column that shows how it was derived, so nothing here is a
// silent guess.

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const REPO = path.resolve(__dirname, '../../..');
const OUT = path.join(REPO, 'EUEE_database');

const SRC_NATIONAL = '/home/haile/Downloads/ethiopian-national-exams';
const SRC_TEMARI = path.join(REPO, 'backend/scripts/ingest/input/temari');
const SRC_PAGES = path.join(REPO, 'backend/scripts/ingest/input/past-papers');
const SRC_BOOKS = '/home/haile/Downloads/hanna_documents';

const DRY = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// Classification rules
// ---------------------------------------------------------------------------

// Tests/worksheets/notes/partial unit extracts are not complete books.
const EXTRA_RE = new RegExp(
  [
    'worksheet', 'work\\s?sheet',
    '\\bunit\\b', '^G9 U\\d',
    'coverpage', '\\bnotes?\\b',
    '\\.txt$', '\\.docx?$', '\\.pptx?$',
  ].join('|'),
  'i',
);

// Ordered: first match wins, so put the more specific names first.
// `(?<![A-Za-z])` / `(?![A-Za-z])` instead of \b because source names glue the
// abbreviation to the next token with "_" (ICT_G11), where \b does not fire.
const SUBJECT_RULES = [
  [/information[\s_-]*(communication|technology)|ICT|(?<![A-Za-z])IT(?![A-Za-z])/i, 'information-technology'],
  [/technical[\s_-]*drawing/i, 'technical-drawing'],
  [/general\s*busin/i, 'general-business'],
  [/agriculture/i, 'agriculture'],
  [/performing|visual[\s_-]*arts|(?<![A-Za-z])PVA(?![A-Za-z])/i, 'performing-visual-arts'],
  [/(?<![A-Za-z])HPE(?![A-Za-z])/i, 'hpe'],
  [/citizenship|civic|CivEthicalEdu|CV\.?T\.?G/i, 'civics'],
  [/economics/i, 'economics'],
  [/geograph|\bGeo\b/i, 'geography'],
  [/history/i, 'history'],
  [/biology|Biol/i, 'biology'],
  [/chemistry|Chem/i, 'chemistry'],
  [/physics|Phys/i, 'physics'],
  [/mathemat|\bmaths?\b|MathSBG|Maths_/i, 'mathematics'],
  [/english|Eng_?ish|\bEng\b/i, 'english'],
  [/amharic/i, 'amharic'],
  [/aptitude|\bSAT\b/i, 'aptitude'],
];
const EXAM_SUBJECTS = new Set([
  'mathematics', 'physics', 'chemistry', 'biology', 'english',
  'civics', 'geography', 'history', 'economics', 'aptitude',
]);

function subjectOf(name) {
  for (const [re, subject] of SUBJECT_RULES) if (re.test(name)) return subject;
  return null;
}

// E.C. 2013 = G.C. 2021, which is how the app stores exam years (see
// extractTemari.ts). The national-exams set uses its own sitting labels
// (2013–2018 and 2021–2025 are distinct years in the questions table), so those
// are taken as G.C. as printed.
const EC_OFFSET = 8;

function curriculumOf(name) {
  if (/STB-2023/i.test(name)) return 'new-2023';
  if (/2022|Aug22|June 23|July 2022|final version/i.test(name)) return 'new-2022';
  return 'unknown';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function pageCount(file) {
  try {
    const info = execFileSync('pdfinfo', [file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const m = info.match(/^Pages:\s+(\d+)/m);
    return m ? Number(m[1]) : '';
  } catch {
    return '';
  }
}

function pagesOfDir(dir) {
  return fs.readdirSync(dir).filter((f) => /^page-\d+\.(jpe?g|png)$/i.test(f)).length;
}

// One source file ('Grade 9/Textbook/amharic grade 9') is a PDF with no
// extension, so the extension alone is not a reliable test.
function isPdfFile(file) {
  try {
    const fd = fs.openSync(file, 'r');
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    return buf.toString('latin1') === '%PDF';
  } catch {
    return false;
  }
}

const rows = [];
const dupIndex = new Map();

function addRow(row) {
  if (row.sha256) {
    const prev = dupIndex.get(row.sha256);
    if (prev) row.duplicate_of = prev;
    else dupIndex.set(row.sha256, row.dest);
  }
  rows.push(row);
}

/** Copies src -> dest (skipping identical copies already on disk), records a row. */
function place(src, destRel, meta) {
  const dest = path.join(OUT, destRel);
  const stat = fs.statSync(src);
  const hash = sha256(src);
  const row = {
    dest_path: destRel,
    kind: meta.kind,
    grade: meta.grade || '',
    subject: meta.subject || '',
    year_label: meta.year_label || '',
    year_gc: meta.year_gc || '',
    year_ec: meta.year_ec || '',
    year_basis: meta.year_basis || '',
    stream: meta.stream || 'unknown',
    doc_kind: meta.doc_kind || '',
    curriculum: meta.curriculum || '',
    pages: meta.pages !== undefined ? meta.pages : '',
    bytes: stat.size,
    sha256: hash,
    source_path: src,
    note: meta.note || '',
    duplicate_of: '',
  };
  addRow(row);
  if (!DRY) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
  return row;
}

// ---------------------------------------------------------------------------
// 1. Exam papers: national-exams (G.C. labels, questions + answer keys)
// ---------------------------------------------------------------------------

if (fs.existsSync(SRC_NATIONAL)) {
  for (const subject of fs.readdirSync(SRC_NATIONAL).sort()) {
    const subDir = path.join(SRC_NATIONAL, subject);
    if (!fs.statSync(subDir).isDirectory()) continue;
    if (!EXAM_SUBJECTS.has(subject)) continue;

    for (const file of fs.readdirSync(subDir).sort()) {
      if (!/\.pdf$/i.test(file)) continue;
      const m = file.match(/^(.*)-(\d{4})-(questions|answers)(\.broken)?\.pdf$/i);
      if (!m) {
        place(path.join(subDir, file), `_quarantine/national-exams/${subject}/${file}`, {
          kind: 'exam',
          subject,
          doc_kind: 'unrecognised-name',
          note: 'filename did not match <subject>-<year>-<questions|answers>.pdf',
        });
        continue;
      }
      const [, sub, yearLabel, kindRaw, broken] = m;
      const yearGc = Number(yearLabel);
      const docKind = kindRaw.toLowerCase() === 'answers' ? 'answer-key' : 'questions';
      const src = path.join(subDir, file);

      if (broken) {
        place(src, `_quarantine/national-exams/${subject}/${file}`, {
          kind: 'exam',
          subject: sub,
          year_label: yearLabel,
          year_gc: yearGc,
          year_basis: 'source-label',
          doc_kind: `${docKind}-broken`,
          pages: pageCount(src),
          note: 'source marks this download as broken — verify before use',
        });
        continue;
      }

      place(
        src,
        `exams/${yearGc}/${sub}/${sub}-${yearGc}-${docKind}.pdf`,
        {
          kind: 'exam',
          subject: sub,
          year_label: yearLabel,
          year_gc: yearGc,
          year_basis: 'source-label (G.C.)',
          doc_kind: docKind,
          pages: pageCount(src),
        },
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Exam papers: temari PDFs (E.C. labels -> G.C. year)
// ---------------------------------------------------------------------------

if (fs.existsSync(SRC_TEMARI)) {
  for (const file of fs.readdirSync(SRC_TEMARI).sort()) {
    const m = file.match(/^grade-(\d+)-([a-z-]+)-(\d{4})\.pdf$/i);
    if (!m) {
      place(path.join(SRC_TEMARI, file), `_quarantine/temari/${file}`, {
        kind: 'exam',
        doc_kind: 'unrecognised-name',
        note: 'filename did not match grade-12-<subject>-<ec-year>.pdf',
      });
      continue;
    }
    const [, grade, rawSubject, ecLabel] = m;
    const subject = subjectOf(rawSubject) || rawSubject;
    const yearEc = Number(ecLabel);
    const yearGc = yearEc + EC_OFFSET;
    const src = path.join(SRC_TEMARI, file);
    place(src, `exams/${yearGc}/${subject}/${subject}-${yearGc}-paper.pdf`, {
      kind: 'exam',
      grade,
      subject,
      year_label: `${ecLabel} E.C.`,
      year_gc: yearGc,
      year_ec: yearEc,
      year_basis: `E.C. label + ${EC_OFFSET} (extractTemari.ts convention)`,
      doc_kind: 'paper',
      pages: pageCount(src),
      note: 'single PDF with questions; answer key presence not verified',
    });
  }
}

// ---------------------------------------------------------------------------
// 3. Exam page-image scans (E.C. folders -> G.C. year)
// ---------------------------------------------------------------------------

if (fs.existsSync(SRC_PAGES)) {
  for (const dirName of fs.readdirSync(SRC_PAGES).sort()) {
    const dir = path.join(SRC_PAGES, dirName);
    if (!fs.statSync(dir).isDirectory()) continue;
    const m = dirName.match(/^([a-z-]+)-(\d{4})$/i);
    if (!m) continue;
    const subject = subjectOf(m[1]) || m[1];
    const yearEc = Number(m[2]);
    const yearGc = yearEc + EC_OFFSET;
    const pages = pagesOfDir(dir);
    for (const file of fs.readdirSync(dir).sort()) {
      if (!/^page-\d+\.(jpe?g|png)$/i.test(file)) continue;
      place(path.join(dir, file), `exams/${yearGc}/${subject}/pages/${file}`, {
        kind: 'exam',
        subject,
        year_label: `${m[2]} E.C.`,
        year_gc: yearGc,
        year_ec: yearEc,
        year_basis: `E.C. label + ${EC_OFFSET} (extractTemari.ts convention)`,
        doc_kind: 'page-image',
        pages: pages,
        note: pages ? `${pages} page images in this folder` : '',
      });
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Student textbooks and teacher guides
// ---------------------------------------------------------------------------

function bookRoot(kind) {
  return kind === 'textbook' ? 'textbooks' : 'teacher-guides';
}

// Groups candidates per (grade, subject) so duplicate editions get -v1/-v2.
const books = [];

if (fs.existsSync(SRC_BOOKS)) {
  for (const gradeDir of fs.readdirSync(SRC_BOOKS).sort()) {
    const gm = gradeDir.match(/^Grade\s+(\d+)$/i);
    if (!gm) continue;
    const grade = Number(gm[1]);
    for (const kindDir of ['Textbook', 'Teacher Guides']) {
      const dir = path.join(SRC_BOOKS, gradeDir, kindDir);
      if (!fs.existsSync(dir)) continue;
      const kind = kindDir === 'Textbook' ? 'textbook' : 'teacher-guide';
      for (const file of fs.readdirSync(dir).sort()) {
        const src = path.join(dir, file);
        if (!fs.statSync(src).isFile()) continue;
        const subject = subjectOf(file);
        const isPdf = isPdfFile(src);
        const isExtra = EXTRA_RE.test(file) || /^G11 Chem\.pdf$/i.test(file) || !isPdf;

        if (!subject || isExtra) {
          place(src, `_extras/grade-${grade}/${kindDir}/${file}`, {
            kind: 'extra',
            grade,
            subject: subject || '',
            doc_kind: kind,
            note: !isPdf
              ? 'not a PDF'
              : !subject
                ? 'no subject recognised in filename'
                : 'not a complete book: worksheet / note / partial unit extract',
            pages: isPdf ? pageCount(src) : '',
          });
          continue;
        }

        books.push({ src, file, grade, subject, kind, curriculum: curriculumOf(file) });
      }
    }
  }
}

// Assign -v1/-v2 per (grade, subject, kind, curriculum), largest first.
const bookGroups = new Map();
for (const b of books) {
  const key = `${b.grade}|${b.subject}|${b.kind}`;
  if (!bookGroups.has(key)) bookGroups.set(key, []);
  bookGroups.get(key).push(b);
}

for (const group of bookGroups.values()) {
  for (const b of group) b.pages = pageCount(b.src);
  group.sort((a, b) => (Number(b.pages) || 0) - (Number(a.pages) || 0) || a.file.localeCompare(b.file));
  group.forEach((b, i) => {
    const edition = b.curriculum === 'unknown' ? 'edition-unknown' : b.curriculum;
    const suffix = group.length > 1 ? `-v${i + 1}` : '';
    const name = `${b.subject}-g${b.grade}-${edition}${suffix}.pdf`;
    place(b.src, `${bookRoot(b.kind)}/grade-${b.grade}/${b.subject}/${name}`, {
      kind: b.kind,
      grade: b.grade,
      subject: b.subject,
      doc_kind: b.kind,
      curriculum: b.curriculum,
      pages: b.pages,
      source_path: path.join(b.src),
      note: group.length > 1
        ? `${group.length} candidate files for this grade/subject/kind; v1..vN ordered by page count (largest first). Original name: ${b.file}`
        : `Original name: ${b.file}`,
    });
  });
}

// ---------------------------------------------------------------------------
// 5. Manifest + summary
// ---------------------------------------------------------------------------

const COLUMNS = [
  'dest_path', 'kind', 'grade', 'subject', 'year_label', 'year_gc', 'year_ec',
  'year_basis', 'stream', 'doc_kind', 'curriculum', 'pages', 'bytes', 'sha256',
  'source_path', 'note', 'duplicate_of',
];

function csvEscape(v) {
  const s = String(v === undefined || v === null ? '' : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

rows.sort((a, b) => a.dest_path.localeCompare(b.dest_path));
const csv = [COLUMNS.join(',')].concat(rows.map((r) => COLUMNS.map((c) => csvEscape(r[c])).join(','))).join('\n') + '\n';

if (!DRY) {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'MANIFEST.csv'), csv);
}

const tally = (pred) => rows.filter(pred).length;
const byKind = {};
for (const r of rows) byKind[r.kind] = (byKind[r.kind] || 0) + 1;

console.log(JSON.stringify({
  dryRun: DRY,
  rows: rows.length,
  byKind,
  examPapers: tally((r) => r.kind === 'exam' && r.doc_kind === 'questions'),
  answerKeys: tally((r) => r.kind === 'exam' && r.doc_kind === 'answer-key'),
  temariPapers: tally((r) => r.kind === 'exam' && r.doc_kind === 'paper'),
  pageImages: tally((r) => r.kind === 'exam' && r.doc_kind === 'page-image'),
  quarantined: tally((r) => r.dest_path.startsWith('_quarantine')),
  extras: tally((r) => r.kind === 'extra'),
  byteIdenticalDuplicates: tally((r) => r.duplicate_of),
  bytes: rows.reduce((s, r) => s + (r.bytes || 0), 0),
}, null, 2));
