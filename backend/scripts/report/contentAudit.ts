// Read-only content audit. Writes nothing except the report files.
//
//   npx tsx scripts/report/contentAudit.ts
//
// Emits docs/content-audit.md and docs/content-audit.csv. Every figure comes
// from Postgres (plus an fs check of referenced page images); nothing is
// estimated.
import { PrismaClient } from '@prisma/client';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const prisma = new PrismaClient();
const IMAGES = resolve(__dirname, '../../assets/textbook-images');
const OUT = resolve(__dirname, '../../../docs');

type Block = { type?: string; filename?: string };
const blocksOf = (b: unknown): Block[] => (Array.isArray(b) ? (b as Block[]) : []);
const optionsOf = (o: unknown): string[] => (Array.isArray(o) ? (o as string[]) : []);

// Placeholder explanations never count as real explanations.
const isRealExplanation = (s: string) =>
  s.trim().length > 0 && !/no explanation available|fill in manually/i.test(s);

function pct(n: number, d: number) {
  return d === 0 ? 'n/a' : `${((n / d) * 100).toFixed(1)}%`;
}

async function main() {
  const [subjects, sections, units, lessons, steps, questions] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: 'asc' } }),
    prisma.textbookSection.findMany(),
    prisma.unit.findMany(),
    prisma.lesson.findMany(),
    prisma.lessonStep.findMany(),
    prisma.question.findMany(),
  ]);

  const subjName = new Map(subjects.map((s) => [s.id, s.name]));
  const subjSlug = new Map(subjects.map((s) => [s.id, s.slug]));

  // ---------- textbooks / teacher guides ----------
  type Book = {
    grade: number;
    subject: string;
    kind: 'TEXTBOOK' | 'TEACHER_GUIDE';
    sections: number;
    chapters: number;
    blocks: number;
    imageBlocks: number;
    textChars: number;
    emptySections: number;
    facsimile: boolean;
    missingImages: number;
  };
  const books = new Map<string, Book>();
  let missingImagesTotal = 0;

  for (const s of sections) {
    const key = `${s.grade}|${s.subjectId}|${s.kind}`;
    let b = books.get(key);
    if (!b) {
      b = {
        grade: s.grade,
        subject: subjName.get(s.subjectId) ?? s.subjectId,
        kind: s.kind as 'TEXTBOOK' | 'TEACHER_GUIDE',
        sections: 0,
        chapters: 0,
        blocks: 0,
        imageBlocks: 0,
        textChars: 0,
        emptySections: 0,
        facsimile: false,
        missingImages: 0,
      };
      books.set(key, b);
    }
    b.sections += 1;
    const blocks = blocksOf(s.blocks);
    b.blocks += blocks.length;
    if (blocks.length === 0) b.emptySections += 1;
    for (const bl of blocks) {
      if (bl.type === 'image') {
        b.imageBlocks += 1;
        if (bl.filename && !existsSync(join(IMAGES, bl.filename))) {
          b.missingImages += 1;
          missingImagesTotal += 1;
        }
      } else if (bl.type === 'text') {
        b.textChars += String((bl as { text?: string }).text ?? '').length;
      }
    }
  }
  // chapters + facsimile flag need per-book grouping
  const chapters = new Map<string, Set<string>>();
  for (const s of sections) {
    const key = `${s.grade}|${s.subjectId}|${s.kind}`;
    if (!chapters.has(key)) chapters.set(key, new Set());
    chapters.get(key)!.add(s.unitTitle);
  }
  for (const [key, b] of books) {
    b.chapters = chapters.get(key)?.size ?? 0;
    b.facsimile = b.sections > 0 && b.imageBlocks >= b.sections && b.textChars < b.sections * 20;
  }

  const bookList = [...books.values()].sort(
    (a, b) => a.grade - b.grade || a.kind.localeCompare(b.kind) || a.subject.localeCompare(b.subject)
  );

  // ---------- lessons ----------
  const stepsByLesson = new Map<string, { type: string; content: unknown }[]>();
  for (const st of steps) {
    if (!stepsByLesson.has(st.lessonId)) stepsByLesson.set(st.lessonId, []);
    stepsByLesson.get(st.lessonId)!.push({ type: st.type, content: st.content });
  }
  type LessonStat = {
    grade: number;
    subject: string;
    units: number;
    lessons: number;
    emptyLessons: number;
    thinLessons: number;
    questions: number;
    types: Record<string, number>;
  };
  const byGradeSubject = new Map<string, LessonStat>();
  for (const u of units) {
    const key = `${u.grade}|${u.subjectId}`;
    if (!byGradeSubject.has(key)) {
      byGradeSubject.set(key, {
        grade: u.grade,
        subject: subjName.get(u.subjectId) ?? u.subjectId,
        units: 0,
        lessons: 0,
        emptyLessons: 0,
        thinLessons: 0,
        questions: 0,
        types: {},
      });
    }
    byGradeSubject.get(key)!.units += 1;
  }
  for (const l of lessons) {
    const u = units.find((x) => x.id === l.unitId);
    if (!u) continue;
    const key = `${u.grade}|${u.subjectId}`;
    const agg = byGradeSubject.get(key);
    if (!agg) continue;
    agg.lessons += 1;
    const ls = stepsByLesson.get(l.id) ?? [];
    if (ls.length === 0) agg.emptyLessons += 1;
    if (ls.length > 0 && ls.length < 2) agg.thinLessons += 1;
    for (const st of ls) {
      agg.types[st.type] = (agg.types[st.type] ?? 0) + 1;
      if (st.type === 'question') agg.questions += 1;
    }
  }
  const lessonRows = [...byGradeSubject.values()].sort((a, b) => a.grade - b.grade || a.subject.localeCompare(b.subject));

  // ---------- UEE questions ----------
  type QStat = {
    grade: number | null;
    year: number;
    stream: string;
    subject: string;
    total: number;
    answered: number;
    explained: number;
    fourOptions: number;
    dupes: number;
  };
  const qmap = new Map<string, QStat>();
  const seen = new Map<string, Set<string>>();
  for (const q of questions) {
    const key = `${q.examYear ?? 'bank'}|${q.stream ?? '-'}|${q.subjectId}`;
    if (!qmap.has(key)) {
      qmap.set(key, {
        grade: null,
        year: q.examYear ?? 0,
        stream: q.stream ?? 'seed',
        subject: subjName.get(q.subjectId) ?? q.subjectId,
        total: 0,
        answered: 0,
        explained: 0,
        fourOptions: 0,
        dupes: 0,
      });
    }
    const a = qmap.get(key)!;
    a.total += 1;
    const opts = optionsOf(q.options);
    const valid = q.correctIndex !== null && q.correctIndex >= 0 && q.correctIndex < opts.length;
    if (valid) a.answered += 1;
    if (isRealExplanation(q.explanation)) a.explained += 1;
    if (opts.length === 4 && opts.every((o) => String(o).trim())) a.fourOptions += 1;
    if (q.examYear !== null) {
      if (!seen.has(key)) seen.set(key, new Set());
      const sig = `${q.prompt}\u0000${JSON.stringify(q.options)}`;
      if (seen.get(key)!.has(sig)) a.dupes += 1;
      seen.get(key)!.add(sig);
    }
  }
  const qRows = [...qmap.values()].sort(
    (a, b) => b.year - a.year || a.subject.localeCompare(b.subject) || a.stream.localeCompare(b.stream)
  );

  const totals = {
    books: bookList.filter((b) => b.kind === 'TEXTBOOK').length,
    guides: bookList.filter((b) => b.kind === 'TEACHER_GUIDE').length,
    sections: sections.length,
    units: units.length,
    lessons: lessons.length,
    steps: steps.length,
    questions: questions.length,
    answered: qRows.reduce((n, r) => n + r.answered, 0),
    examQuestions: questions.filter((q) => q.examYear !== null).length,
    examAnswered: qRows.filter((r) => r.year > 0).reduce((n, r) => n + r.answered, 0),
  };

  // ---------- write ----------
  await mkdir(OUT, { recursive: true });

  const md: string[] = [];
  md.push('# Compass content audit', '', `Generated from Postgres; read-only.`, '');
  md.push('## Executive summary', '');
  md.push(`- Student textbooks: **${totals.books}** (subject × grade, at least one section)`);
  md.push(`- Teacher guides: **${totals.guides}**`);
  md.push(`- Sections: **${totals.sections}**`);
  md.push(`- Interactive units: **${totals.units}**, lessons: **${totals.lessons}**, steps: **${totals.steps}**`);
  md.push(`- Questions: **${totals.questions}** (${totals.examQuestions} past-paper, ${totals.questions - totals.examQuestions} seed)`);
  md.push(
    `- Answered: **${totals.answered}** (${pct(totals.answered, totals.questions)} overall; ` +
      `past-paper ${pct(totals.examAnswered, totals.examQuestions)})`
  );
  md.push(`- Referenced page images missing from disk: **${missingImagesTotal}**`, '');

  md.push('## Textbooks and teacher guides', '');
  md.push('| Grade | Subject | Kind | Sections | Chapters | Blocks | Image pages | Facsimile | Empty sections | Missing images |');
  md.push('|---|---|---|---:|---:|---:|---:|---|---:|---:|');
  for (const b of bookList) {
    md.push(
      `| ${b.grade} | ${b.subject} | ${b.kind === 'TEXTBOOK' ? 'Textbook' : 'Teacher guide'} | ${b.sections} | ${b.chapters} | ${b.blocks} | ${b.imageBlocks} | ${b.facsimile ? 'yes' : 'no'} | ${b.emptySections} | ${b.missingImages} |`
    );
  }
  md.push('');

  md.push('## Interactive lessons', '');
  md.push('| Grade | Subject | Units | Lessons | Empty | Thin (1 step) | Question steps | Step types |');
  md.push('|---|---|---:|---:|---:|---:|---:|---|');
  for (const l of lessonRows) {
    const types = Object.entries(l.types).map(([k, v]) => `${k}:${v}`).join(', ') || '—';
    md.push(`| ${l.grade} | ${l.subject} | ${l.units} | ${l.lessons} | ${l.emptyLessons} | ${l.thinLessons} | ${l.questions} | ${types} |`);
  }
  md.push('');

  md.push('## UEE questions by year, stream and subject', '');
  md.push('| Year | Stream | Subject | Total | Answered | Unanswered | Coverage | With explanation | 4 valid options | Duplicates |');
  md.push('|---|---|---|---:|---:|---:|---:|---:|---:|---:|');
  for (const r of qRows) {
    md.push(
      `| ${r.year || 'seed bank'} | ${r.stream} | ${r.subject} | ${r.total} | ${r.answered} | ${r.total - r.answered} | ${pct(r.answered, r.total)} | ${r.explained} | ${r.fourOptions} | ${r.dupes} |`
    );
  }
  md.push('');

  await writeFile(join(OUT, 'content-audit.md'), md.join('\n'));

  const csv = ['grade,subject,kind,sections,chapters,blocks,image_pages,facsimile,empty_sections,missing_images'];
  for (const b of bookList) {
    csv.push([b.grade, JSON.stringify(b.subject), b.kind, b.sections, b.chapters, b.blocks, b.imageBlocks, b.facsimile ? 'yes' : 'no', b.emptySections, b.missingImages].join(','));
  }
  csv.push('', 'year,stream,subject,total,answered,unanswered,coverage_pct,explained,four_options,duplicates');
  for (const r of qRows) {
    csv.push([r.year || 'seed', r.stream, JSON.stringify(r.subject), r.total, r.answered, r.total - r.answered, r.total ? ((r.answered / r.total) * 100).toFixed(2) : '', r.explained, r.fourOptions, r.dupes].join(','));
  }
  await writeFile(join(OUT, 'content-audit.csv'), csv.join('\n'));

  console.log('textbooks', totals.books, '| guides', totals.guides, '| sections', totals.sections);
  console.log('units', totals.units, '| lessons', totals.lessons, '| steps', totals.steps);
  console.log('questions', totals.questions, '| exam', totals.examQuestions, '| answered', totals.answered);
  console.log('missing images on disk', missingImagesTotal);
  console.log('wrote docs/content-audit.md and docs/content-audit.csv');
}

main().finally(() => prisma.$disconnect());
