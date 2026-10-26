// Phase 3 of the AI-handover export: dumps every educational-content table to
// JSON, chunked by subject for readability and upload-size manageability.
// Read-only — never writes to the database. Explicitly excludes every
// user/auth/payment table (User, QuizAttempt*, Subscription,
// TelebirrSubmission, ChatMessage, UserBookmark/Highlight/ReadingProgress,
// UserStats, XpEvent, Notification) by construction: this script's queries
// simply never touch those models.
import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../../src/lib/prisma';

const outRoot = process.argv[2];
if (!outRoot) throw new Error('Usage: tsx exportEducational.ts <output-dir>/data');

function writeChunk(relPath: string, table: string, filterDescription: string, records: unknown[]) {
  const full = join(outRoot, relPath);
  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(
    full,
    JSON.stringify(
      { table, filterDescription, recordCount: records.length, exportedAt: new Date().toISOString(), records },
      null,
      2
    )
  );
  return records.length;
}

async function main() {
  const manifestRows: { file: string; table: string; records: number }[] = [];

  const subjects = await prisma.subject.findMany({ orderBy: { slug: 'asc' } });
  manifestRows.push({ file: 'subjects.json', table: 'subjects', records: writeChunk('subjects.json', 'subjects', 'all rows', subjects) });

  const units = await prisma.unit.findMany({ orderBy: [{ subjectId: 'asc' }, { grade: 'asc' }, { order: 'asc' }] });
  manifestRows.push({ file: 'units.json', table: 'units', records: writeChunk('units.json', 'units', 'all rows', units) });

  const lessons = await prisma.lesson.findMany({ orderBy: [{ unitId: 'asc' }, { order: 'asc' }] });
  manifestRows.push({ file: 'lessons.json', table: 'lessons', records: writeChunk('lessons.json', 'lessons', 'all rows', lessons) });

  const lessonSteps = await prisma.lessonStep.findMany({ orderBy: [{ lessonId: 'asc' }, { order: 'asc' }] });
  manifestRows.push({ file: 'lesson_steps.json', table: 'lesson_steps', records: writeChunk('lesson_steps.json', 'lesson_steps', 'all rows', lessonSteps) });

  for (const subject of subjects) {
    const questions = await prisma.question.findMany({
      where: { subjectId: subject.id },
      orderBy: [{ examYear: 'asc' }, { stream: 'asc' }],
    });
    if (questions.length === 0) continue;
    const file = `questions/${subject.slug}.json`;
    const n = writeChunk(file, 'questions', `subjectId = ${subject.slug} (${subject.id})`, questions);
    manifestRows.push({ file, table: 'questions', records: n });
  }

  for (const subject of subjects) {
    for (const kind of ['TEXTBOOK', 'TEACHER_GUIDE'] as const) {
      const sections = await prisma.textbookSection.findMany({
        where: { subjectId: subject.id, kind },
        orderBy: [{ grade: 'asc' }, { order: 'asc' }],
      });
      if (sections.length === 0) continue;
      const file = `textbook_sections/${subject.slug}_${kind.toLowerCase()}.json`;
      const n = writeChunk(file, 'textbook_sections', `subjectId = ${subject.slug} (${subject.id}), kind = ${kind}`, sections);
      manifestRows.push({ file, table: 'textbook_sections', records: n });
    }
  }

  const totalsByTable = manifestRows.reduce<Record<string, number>>((acc, r) => {
    acc[r.table] = (acc[r.table] ?? 0) + r.records;
    return acc;
  }, {});

  console.log(`Wrote ${manifestRows.length} files.`);
  console.log('Totals by table:', totalsByTable);
  writeFileSync(join(outRoot, '_export_manifest.json'), JSON.stringify({ files: manifestRows, totalsByTable }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
