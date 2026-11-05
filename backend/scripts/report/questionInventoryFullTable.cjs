// Emits the COMPLETE per-year/stream/subject inventory table (2004–2025).
// Reporting only: reads Postgres and EUEE_database/MANIFEST.csv, writes nothing
// to the database.
//
//   node backend/scripts/report/questionInventoryFullTable.cjs
//
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO = path.resolve(__dirname, '../../..');
const BACKEND = path.join(REPO, 'backend');
const OUT = path.join(REPO, 'docs/question-inventory-full-table.md');

const url = (() => {
  const env = fs.readFileSync(path.join(BACKEND, '.env'), 'utf8');
  const m = env.match(/DATABASE_URL="([^"]+)"/) || env.match(/DATABASE_URL=(\S+)/);
  return m[1].replace(/\?schema=public/, '');
})();

const psql = (q) =>
  execFileSync('psql', [url, '-At', '-F', '\t', '-c', q], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
    .map((l) => l.split('\t'));

const PLACEHOLDER_SQL = `(
  explanation is null or btrim(explanation) = ''
  or explanation like '(no explanation%'
  or explanation like 'Per the source''s marked answer%'
)`;

const rows = psql(`
  select q."examYear"::text, s.slug, q.stream::text, count(*)::text,
    count(*) filter (where q."correctIndex" is not null and q."correctIndex" >= 0
      and q."correctIndex" < jsonb_array_length(q.options))::text,
    count(*) filter (where not ${PLACEHOLDER_SQL})::text
  from questions q join subjects s on s.id = q."subjectId"
  where q."examYear" is not null
  group by 1,2,3
`);

const db = new Map();
for (const [y, slug, stream, n, answered, explained] of rows) {
  db.set(`${y}|${slug}|${stream}`, { n: +n, answered: +answered, explained: +explained });
}

const sharedMap = new Map(
  psql(`
    with base as (
      select q."examYear" as y, s.slug, q.stream::text as st, q.prompt, q.options::text as opts
      from questions q join subjects s on s.id = q."subjectId" where q."examYear" is not null
    ),
    inter as (
      select distinct y, slug, prompt, opts from base where st = 'natural'
      intersect
      select distinct y, slug, prompt, opts from base where st = 'social'
    )
    select y::text, slug, count(*)::text from inter group by 1,2
  `).map(([y, s, n]) => [`${y}|${s}`, +n]),
);

const practice = psql(`select count(*)::text from questions where "examYear" is null`)[0][0];

// ---- paper-level provenance from the library ---------------------------------
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

const papers = new Map();
const manifest = path.join(REPO, 'EUEE_database/MANIFEST.csv');
if (fs.existsSync(manifest)) {
  const lines = fs.readFileSync(manifest, 'utf8').split('\n').filter(Boolean);
  const head = splitCsvLine(lines[0]).map((h) => h.trim());
  const ix = (n) => head.indexOf(n);
  for (const line of lines.slice(1)) {
    const p = splitCsvLine(line);
    if (p[ix('kind')] !== 'exam') continue;
    const year = p[ix('year_gc')];
    const subject = p[ix('subject')];
    const kind = p[ix('doc_kind')] || '';
    const src = p[ix('source_path')] || '';
    if (!year || !subject || /broken/.test(kind)) continue;
    const key = `${year}|${subject}`;
    if (!papers.has(key)) papers.set(key, new Set());
    const origin = /ethiopian-national-exams/.test(src) ? 'national-exams' : /temari/.test(src) ? 'temari' : 'page-scan';
    papers.get(key).add(`${origin}:${kind}`);
  }
}

function sourceLabel(year, subject, n) {
  const kinds = papers.get(`${year}|${subject}`);
  if (!kinds) return n ? 'UNKNOWN — rows exist, no paper in library' : '— not in library';
  const has = (o, k) => kinds.has(`${o}:${k}`);
  const parts = [];
  if (has('national-exams', 'questions')) parts.push('national-exams PDF (questions' + (has('national-exams', 'answer-key') ? ' + key)' : ' only)'));
  if (has('temari', 'paper')) parts.push('temari PDF (questions only, no key file)');
  if (has('page-scan', 'page-image')) parts.push('page scans');
  return parts.join(' + ') || '— not in library';
}

// ---- grid -------------------------------------------------------------------
const NATURAL = ['biology', 'chemistry', 'civics', 'english', 'mathematics', 'physics', 'aptitude'];
const SOCIAL = ['civics', 'economics', 'english', 'geography', 'history', 'mathematics', 'aptitude'];
const YEARS = [];
for (let y = 2004; y <= 2025; y++) YEARS.push(y);

const out = [];
out.push('# Complete question inventory — every year, stream and subject (2004–2025)');
out.push('');
out.push('| Exam Year (G.C.) | Stream | Subject | Total Questions | Answered Questions | Unanswered Questions | Questions With Explanations | Questions Without Explanations | Source |');
out.push('|---:|---|---|---:|---:|---:|---:|---:|---|');

const lowBySubject = new Map();
let natTotal = 0;
let socTotal = 0;
const yearTotals = new Map();

for (const y of YEARS) {
  for (const stream of ['natural', 'social']) {
    for (const subject of stream === 'natural' ? NATURAL : SOCIAL) {
      const rec = db.get(`${y}|${subject}|${stream}`) || { n: 0, answered: 0, explained: 0 };
      const shared = sharedMap.get(`${y}|${subject}`) || 0;
      const src = sourceLabel(y, subject, rec.n);
      const sharedTag = shared > 0 && rec.n > 0 && shared === rec.n ? ' · same paper stored in both streams' : '';
      const subjectLabel = subject.replace(/^./, (c) => c.toUpperCase());
      out.push(
        `| ${y} | ${stream === 'natural' ? 'Natural' : 'Social'} | ${subjectLabel} | ${rec.n} | ${rec.answered} | ${rec.n - rec.answered} | ${rec.explained} | ${rec.n - rec.explained} | ${src}${sharedTag} |`,
      );
      if (rec.n) {
        if (stream === 'natural') natTotal += rec.n; else socTotal += rec.n;
        yearTotals.set(y, (yearTotals.get(y) || 0) + rec.n);
        const cur = lowBySubject.get(subject) || { n: 0, answered: 0, explained: 0 };
        lowBySubject.set(subject, {
          n: cur.n + rec.n,
          answered: cur.answered + rec.answered,
          explained: cur.explained + rec.explained,
        });
      }
    }
  }
}

out.push('');
out.push(`Practice-bank rows (no exam year, excluded from every row above): **${practice}**.`);
fs.writeFileSync(OUT, out.join('\n') + '\n');

// ---- console: table + summary ----------------------------------------------
console.log(out.join('\n'));
console.log('\n--- SUMMARY ---');
console.log(JSON.stringify({
  naturalRows: natTotal,
  socialRows: socTotal,
  yearsWithNoRows: YEARS.filter((y) => !yearTotals.has(y)),
  perYearRows: Object.fromEntries([...yearTotals.entries()].sort((a, b) => a[0] - b[0])),
  practiceRows: Number(practice),
}, null, 2));
