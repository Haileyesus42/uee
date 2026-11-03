// Read-only question inventory: per exam year × stream × subject.
//
//   node backend/scripts/report/questionInventory.cjs
//
// Writes docs/question-inventory.md and docs/question-inventory.csv.
// Reads Postgres only; never writes to the database. Paper-level source comes
// from EUEE_database/MANIFEST.csv, because the questions table has no
// per-question source column — that limitation is reported, not papered over.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO = path.resolve(__dirname, '../../..');
const BACKEND = path.join(REPO, 'backend');
const OUT_MD = path.join(REPO, 'docs/question-inventory.md');
const OUT_CSV = path.join(REPO, 'docs/question-inventory.csv');

const url = (() => {
  const env = fs.readFileSync(path.join(BACKEND, '.env'), 'utf8');
  const m = env.match(/DATABASE_URL="([^"]+)"/) || env.match(/DATABASE_URL=(\S+)/);
  if (!m) throw new Error('DATABASE_URL not found in backend/.env');
  return m[1].replace(/\?schema=public/, '');
})();

function sql(query) {
  const out = execFileSync('psql', [url, '-At', '-F', '\t', '-c', query], { encoding: 'utf8' });
  return out.split('\n').filter(Boolean).map((l) => l.split('\t'));
}

// Placeholders the pipeline writes when the source published no explanation —
// they are not explanations, so they must not be counted as such.
const PLACEHOLDER_SQL = `(
  explanation is null or btrim(explanation) = ''
  or explanation like '(no explanation%'
  or explanation like 'Per the source''s marked answer%'
)`;

const rows = sql(`
  select q."examYear"::text as year,
         s.slug,
         q.stream::text as stream,
         count(*)::text as rows,
         count(distinct (q.prompt, q.options::text))::text as distinct_q,
         count(*) filter (
           where q."correctIndex" is not null
             and q."correctIndex" >= 0
             and q."correctIndex" < jsonb_array_length(q.options)
         )::text as answered,
         count(*) filter (where not ${PLACEHOLDER_SQL})::text as explained,
         count(*) filter (where q."aiDeepExplanation" is not null)::text as deep
  from questions q join subjects s on s.id = q."subjectId"
  where q."examYear" is not null
  group by q."examYear", s.slug, q.stream
  order by q."examYear", s.slug, q.stream
`);

// Cross-stream overlap: same prompt AND same options present in both streams.
const shared = new Map(
  sql(`
    with base as (
      select q."examYear" as y, s.slug, q.stream::text as st, q.prompt, q.options::text as opts
      from questions q join subjects s on s.id = q."subjectId"
      where q."examYear" is not null
    ),
    inter as (
      select distinct y, slug, prompt, opts from base where st = 'natural'
      intersect
      select distinct y, slug, prompt, opts from base where st = 'social'
    )
    select y::text, slug, count(*)::text from inter group by 1,2
  `).map(([y, s, n]) => [`${y}|${s}`, Number(n)]),
);

const totals = sql(`
  select
    count(*) filter (where q."examYear" is not null)::text,
    count(distinct (q.prompt, q.options::text)) filter (where q."examYear" is not null)::text,
    count(*) filter (where q."examYear" is not null
      and q."correctIndex" is not null and q."correctIndex" >= 0
      and q."correctIndex" < jsonb_array_length(q.options))::text,
    count(*) filter (where q."examYear" is not null and not ${PLACEHOLDER_SQL})::text,
    count(*) filter (where q."examYear" is null)::text
  from questions q
`)[0];

// Paper-level provenance for each year+subject, from the organized library.
const paperSource = new Map();
const manifestPath = path.join(REPO, 'EUEE_database/MANIFEST.csv');

// Minimal RFC4180 split: MANIFEST quotes any field containing a comma.
function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else quoted = false;
      } else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

if (fs.existsSync(manifestPath)) {
  const lines = fs.readFileSync(manifestPath, 'utf8').split('\n').filter(Boolean);
  const head = splitCsvLine(lines[0]).map((h) => h.trim());
  const idx = (n) => head.indexOf(n);
  for (const line of lines.slice(1)) {
    const parts = splitCsvLine(line);
    if (parts[idx('kind')] !== 'exam') continue;
    const year = parts[idx('year_gc')];
    const subject = parts[idx('subject')];
    if (!year || !subject) continue;
    const key = `${year}|${subject}`;
    const src = parts[idx('source_path')] || '';
    const kind = parts[idx('doc_kind')];
    const label = /ethiopian-national-exams/.test(src) ? 'national-exams' : /temari/.test(src) ? 'temari' : 'page-scan';
    if (!paperSource.has(key)) paperSource.set(key, new Set());
    paperSource.get(key).add(`${label}:${kind}`);
  }
}

const subjects = [...new Set(rows.map((r) => r[1]))].sort();
const years = [...new Set(rows.map((r) => Number(r[0])))].sort((a, b) => a - b);

const fmt = (n) => Number(n).toLocaleString('en-US');
const esc = (s) => String(s).replace(/\|/g, '\\|');

// ---- CSV (one row per year × stream × subject) -----------------------------
const csv = [
  ['exam_year_gc', 'stream', 'subject', 'questions_in_paper', 'answered', 'with_explanation', 'with_deep_explanation',
    'identical_to_other_stream', 'paper_source', 'per_question_source_recorded'].join(','),
];
for (const r of rows) {
  const [year, slug, stream, n, , answered, explained, deep] = r;
  const sh = shared.get(`${year}|${slug}`) || 0;
  const src = [...(paperSource.get(`${year}|${slug}`) || [])].sort().join(' + ');
  csv.push([year, stream, slug, n, answered, explained, deep, sh || '', `"${src}"`, 'no'].join(','));
}
fs.mkdirSync(path.dirname(OUT_CSV), { recursive: true });
fs.writeFileSync(OUT_CSV, csv.join('\n') + '\n');

// ---- Markdown --------------------------------------------------------------
const md = [];
md.push('# Question inventory — by exam year, stream and subject');
md.push('');
md.push(`Generated ${new Date().toISOString().slice(0, 10)} by \`backend/scripts/report/questionInventory.cjs\` from the \`compass_dev\` database. Read-only; every number below is a query result, not an estimate.`);
md.push('');
md.push('## How to read this');
md.push('');
md.push('- **Questions in paper** — rows stored for that year/stream/subject.');
md.push('- **Answered** — `correctIndex` present *and* inside the option range.');
md.push('- **With explanation** — a real explanation; the pipeline placeholders ("(no explanation in the marking key)", "(no explanation available …)", "Per the source\'s marked answer.") are counted as **missing**.');
md.push('- **Identical to other stream** — questions whose prompt *and* options also appear in the other stream\'s paper. Such a paper is stored twice, so summing rows overstates the archive. Do not add the two stream rows for that subject-year.');
md.push('- **Paper source** — which file in `EUEE_database/` the paper came from. The `questions` table has **no per-question source column**, so provenance cannot be attributed per row; the last column records that limitation.');
md.push('');
md.push('## Totals');
md.push('');
md.push(`| Measure | Count |`);
md.push(`|---|---:|`);
md.push(`| Past-paper rows (all streams) | ${fmt(totals[0])} |`);
md.push(`| **Distinct past-paper questions** (stream-duplicate papers collapsed) | **${fmt(totals[1])}** |`);
md.push(`| Answered | ${fmt(totals[2])} |`);
md.push(`| With a real explanation | ${fmt(totals[3])} |`);
md.push(`| Practice-bank rows (no exam year — not a past paper) | ${fmt(totals[4])} |`);
md.push('');
md.push(`Answered share: ${(100 * Number(totals[2]) / Number(totals[0])).toFixed(1)}% of rows.`);
md.push('');
const sumBy = (stream) => rows.filter((r) => r[2] === stream).reduce((s, r) => s + Number(r[3]), 0);
md.push('| Stream | Rows |');
md.push('|---|---:|');
md.push(`| Natural Science | ${fmt(sumBy('natural'))} |`);
md.push(`| Social Science | ${fmt(sumBy('social'))} |`);
md.push('');
md.push('The two stream columns must not be added to get the archive size — see the `Identical to other stream` column and the distinct total above.');
md.push('');
md.push('## Per paper');
md.push('');
md.push('| Year (G.C.) | Stream | Subject | Questions in paper | Answered | With explanation | Identical to other stream | Paper source |');
md.push('|---:|---|---|---:|---:|---:|---:|---|');
let curYear = null;
for (const r of rows) {
  const [year, slug, stream, n, , answered, explained] = r;
  const sh = shared.get(`${year}|${slug}`) || '';
  const src = [...(paperSource.get(`${year}|${slug}`) || [])].sort().join(' + ');
  md.push(`| ${year === curYear ? '' : year} | ${stream} | ${esc(slug)} | ${fmt(n)} | ${fmt(answered)} | ${fmt(explained)} | ${sh ? fmt(sh) : '—'} | ${esc(src) || '_no paper file_'} |`);
  curYear = year;
}
md.push('');
md.push('## Gaps');
md.push('');
md.push('Every paper that is missing outright (no row at all), grouped by cause.');
md.push('');
const held = new Set(rows.map((r) => `${r[0]}|${r[1]}|${r[2]}`));
const EXPECTED = ['biology', 'chemistry', 'civics', 'economics', 'english', 'geography', 'history', 'mathematics', 'physics', 'aptitude'];
const NATURAL = ['biology', 'chemistry', 'civics', 'english', 'mathematics', 'physics', 'aptitude'];
const SOCIAL = ['civics', 'economics', 'english', 'geography', 'history', 'mathematics', 'aptitude'];
const allYears = [];
for (let y = 2013; y <= 2025; y++) allYears.push(y);

const wholeYear = [];
const wholeSubject = [];
const singlePaper = [];
for (const y of allYears) {
  const natMissing = NATURAL.filter((s) => !held.has(`${y}|${s}|natural`));
  const socMissing = SOCIAL.filter((s) => !held.has(`${y}|${s}|social`));
  if (natMissing.length === NATURAL.length && socMissing.length === SOCIAL.length) {
    wholeYear.push(y);
    continue;
  }
  const shared = NATURAL.filter((s) => !held.has(`${y}|${s}|natural`) && !held.has(`${y}|${s}|social`));
  const natOnly = natMissing.filter((s) => !shared.includes(s));
  const socOnly = socMissing.filter((s) => !shared.includes(s));
  if (shared.length) wholeSubject.push({ y, subjects: shared });
  for (const s of natOnly) singlePaper.push({ y, stream: 'natural', s });
  for (const s of socOnly) singlePaper.push({ y, stream: 'social', s });
}

const noteFor = (y, subject) => {
  if (subject === 'civics' && y === 2025)
    return ' — _absent from all four archives checked; likely not an examined subject that year (SOURCES.md)_';
  if (subject === 'economics' && y >= 2021)
    return ' — _absent from every online archive checked; possibly not examined in this year_';
  if (y <= 2018 && ['geography', 'history', 'economics', 'aptitude'].includes(subject))
    return ' — _never digitised by any archive found; the printed-compilation route is the only one (SOURCES.md §2b)_';
  return '';
};

md.push('### Whole examination years with nothing in the database');
md.push('');
if (wholeYear.length) {
  md.push(`- **${wholeYear.join(', ')}** — no rows for any subject in either stream (${wholeYear.length * 14} papers).`);
} else {
  md.push('- none');
}
md.push('');
md.push('### Subjects missing in both streams for a year');
md.push('');
if (wholeSubject.length) {
  for (const { y, subjects: subs } of wholeSubject)
    md.push(`- **${y}** — missing ${subs.length}: ${subs.join(', ')}${subs.length === 1 ? noteFor(y, subs[0]) : ''}`);
} else {
  md.push('- none');
}
md.push('');
md.push('### Single missing papers');
md.push('');
if (singlePaper.length) {
  for (const { y, stream, s } of singlePaper) md.push(`- **${y} ${stream}** — ${s}${noteFor(y, s)}`);
} else {
  md.push('- none');
}
md.push('');
md.push('Subjects present in at least one year: ' + EXPECTED.filter((e) => subjects.includes(e)).join(', ') + '.');
md.push('');
md.push('## Method and limits');
md.push('');
md.push('- Source of truth: the `questions` table (`examYear` not null) joined to `subjects`. Nothing inferred.');
md.push('- "Distinct" means distinct `(prompt, options)` within the whole table. Two questions with the same prompt but different options are counted separately, because that is what a student sees.');
md.push('- The `Identical to other stream` column is computed by intersecting the two streams\' `(prompt, options)` sets — not by trusting the stream label.');
md.push('- Paper-level provenance comes from `EUEE_database/MANIFEST.csv`. Where that file has no paper for a year+subject that has rows, the source column reads `_no paper file_`: the rows exist but their source file is not in the library.');
md.push('- `aiDeepExplanation` coverage is in the CSV; it was not counted as "with explanation" because the app shows the short explanation first.');
md.push('');
fs.writeFileSync(OUT_MD, md.join('\n') + '\n');

console.log(JSON.stringify({
  years, subjects,
  perPaperRows: rows.length,
  distinctQuestions: Number(totals[1]),
  rowsTotal: Number(totals[0]),
  answered: Number(totals[2]),
  explained: Number(totals[3]),
  practiceRows: Number(totals[4]),
  sharedGroups: [...shared.entries()].filter(([, n]) => n > 0).length,
  wrote: [path.relative(REPO, OUT_MD), path.relative(REPO, OUT_CSV)],
}, null, 2));
