// Writes a reviewed extraction file (from extractPastPaper.ts / extractLesson.ts)
// into Postgres. Refuses any item that isn't explicitly reviewed:true — this is the
// one gate between "the model's best guess" and "content a student studies from."
//
// Usage:
//   npm run ingest:import -- --questions ./scripts/ingest/output/mathematics-2015.json --subject mathematics --year 2015
//   npm run ingest:import -- --questions ./scripts/ingest/output/english-2025-natural.json --subject english --year 2025 --stream natural
//   npm run ingest:import -- --lesson ./scripts/ingest/output/lesson-quadratic-equations.json --lessonId quadratic-equations
//
// Importing a lesson REPLACES that lesson's existing steps (the mock ones from
// seed.ts, or a previous ingestion run) — reruns are safe and idempotent.
// Importing questions for a subject+year REPLACES any questions already tagged
// with that subjectId+examYear+stream, for the same reason. --stream is required
// for any subject that spans both UEE streams (see Subject.streams in the schema)
// — omitting it targets the streamless (examYear-only) slot instead.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PrismaClient, Stream, TextbookSectionKind } from '@prisma/client';
import { ExtractedQuestionBatchSchema, ExtractedLessonStepBatchSchema, ExtractedTextbookSectionBatchSchema } from './schemas';

const prisma = new PrismaClient();

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      args[argv[i].slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

async function importQuestions(path: string, subjectSlug: string, year: number, stream?: Stream) {
  const raw = JSON.parse(await readFile(path, 'utf-8'));
  const all = ExtractedQuestionBatchSchema.parse(raw);
  const reviewed = all.filter((q) => q.reviewed);
  const skipped = all.length - reviewed.length;

  if (reviewed.length === 0) {
    throw new Error('No reviewed:true questions in this file — nothing to import.');
  }

  // Second, independent safety net beyond reviewed:true — catches the case where
  // a source file had no recoverable answer key (correctIndex left at -1 by
  // extractExam.ts) and a reviewer flipped reviewed:true without noticing the
  // answer was never actually filled in. Hard-fails the whole batch rather than
  // silently skipping, since a partial import is easy to lose track of.
  // `-1` (extractExam.ts sentinel) and out-of-range indices are still rejected —
  // but `-1` is now a *valid* "no answer key" marker, imported as a NULL so the
  // question is readable yet never scored. Anything else out of range is a real
  // data error and still fails the batch.
  const invalid = reviewed.filter(
    (q) => q.correctIndex !== -1 && (q.correctIndex < 0 || q.correctIndex >= q.options.length)
  );
  if (invalid.length > 0) {
    throw new Error(
      `${invalid.length} reviewed:true question(s) have an out-of-range correctIndex (e.g. "${invalid[0].prompt.slice(0, 60)}..."). ` +
        `Fix the answer key for these before importing — nothing was written.`
    );
  }

  const subject = await prisma.subject.findUnique({ where: { slug: subjectSlug } });
  if (!subject) throw new Error(`No subject with slug "${subjectSlug}" — check backend/prisma/seed.ts for valid slugs.`);
  if (stream && !subject.streams.includes(stream)) {
    throw new Error(`Subject "${subjectSlug}" isn't tagged for stream "${stream}" — check backend/prisma/seed.ts.`);
  }

  // subjectId+examYear alone isn't a unique paper once a subject spans both
  // streams (e.g. English) — a natural-science import must not delete that same
  // subject+year's social-science questions, and vice versa.
  await prisma.$transaction([
    prisma.question.deleteMany({ where: { subjectId: subject.id, examYear: year, stream: stream ?? null } }),
    prisma.question.createMany({
      data: reviewed.map((q) => ({
        subjectId: subject.id,
        prompt: q.prompt,
        options: q.options,
        // -1 = "no answer key in the source" → NULL, so the row is readable but
        // can never be scored.
        correctIndex: q.correctIndex === -1 ? null : q.correctIndex,
        explanation: q.explanation,
        examYear: year,
        stream,
      })),
    }),
  ]);

  console.log(`Imported ${reviewed.length} question(s) for ${subjectSlug} ${year}${stream ? ` (${stream})` : ''}.`);
  if (skipped > 0) console.log(`Skipped ${skipped} not marked reviewed:true.`);
}

async function importLesson(path: string, lessonId: string) {
  const raw = JSON.parse(await readFile(path, 'utf-8'));
  const all = ExtractedLessonStepBatchSchema.parse(raw);
  const reviewed = all.filter((s) => s.reviewed);
  const skipped = all.length - reviewed.length;

  if (reviewed.length === 0) {
    throw new Error('No reviewed:true steps in this file — nothing to import.');
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw new Error(`No lesson with id "${lessonId}" — check backend/prisma/seed.ts for valid lesson ids.`);

  await prisma.$transaction([
    prisma.lessonStep.deleteMany({ where: { lessonId } }),
    prisma.lessonStep.createMany({
      data: reviewed.map((step, order) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { type, reviewed: _reviewed, confidence: _confidence, sourcePage: _sourcePage, ...content } = step;
        return { lessonId, type, order, content };
      }),
    }),
  ]);

  console.log(`Imported ${reviewed.length} step(s) into lesson "${lessonId}".`);
  if (skipped > 0) console.log(`Skipped ${skipped} not marked reviewed:true.`);
}

// Strips a leading "1.1 " / "1.1. " numbering prefix so section titles compare
// cleanly against Lesson titles, which don't carry the textbook's numbering.
function stripNumberPrefix(title: string): string {
  return title.replace(/^\d+(\.\d+)*\.?\s*/, '').trim().toLowerCase();
}

async function importTextbook(path: string, subjectSlug: string) {
  const raw = JSON.parse(await readFile(path, 'utf-8'));
  const sections = ExtractedTextbookSectionBatchSchema.parse(raw);

  if (sections.length === 0) {
    throw new Error('No sections in this file — nothing to import.');
  }

  const subject = await prisma.subject.findUnique({ where: { slug: subjectSlug } });
  if (!subject) throw new Error(`No subject with slug "${subjectSlug}" — check backend/prisma/seed.ts for valid slugs.`);

  // Best-effort cross-link to the matching structured Lesson, by title — lets the
  // reader offer "practice this as a guided lesson" without hand-wiring every id.
  const lessons = await prisma.lesson.findMany({
    where: { unit: { subjectId: subject.id } },
    select: { id: true, title: true },
  });
  const lessonByTitle = new Map(lessons.map((l) => [l.title.trim().toLowerCase(), l.id]));

  // 'teacher_guide' sections don't cross-link to a structured Lesson — that
  // link is for "practice this as a guided lesson," which only makes sense
  // from the student's own textbook.
  const kind: TextbookSectionKind = sections[0].kind === 'teacher_guide' ? 'TEACHER_GUIDE' : 'TEXTBOOK';
  let linked = 0;
  const data = sections.map((s) => {
    const lessonId = kind === 'TEXTBOOK' ? lessonByTitle.get(stripNumberPrefix(s.sectionTitle)) ?? null : null;
    if (lessonId) linked += 1;
    return {
      subjectId: subject.id,
      grade: s.grade,
      kind,
      unitTitle: s.unitTitle,
      sectionTitle: s.sectionTitle,
      order: s.order,
      blocks: s.blocks,
      pageStart: s.pageStart,
      pageEnd: s.pageEnd,
      lessonId,
    };
  });

  // Scoped to this file's grade AND kind, not the whole subject — a subject
  // can have multiple grades imported separately (e.g. history g9-g12), and
  // the student textbook and teacher guide for the same subject+grade are
  // separate books that must not delete each other's sections.
  const grade = sections[0].grade;
  await prisma.$transaction([
    prisma.textbookSection.deleteMany({ where: { subjectId: subject.id, grade, kind } }),
    prisma.textbookSection.createMany({ data }),
  ]);

  console.log(`Imported ${sections.length} ${kind} section(s) for ${subjectSlug} (${linked} cross-linked to an existing lesson).`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.questions) {
    if (!args.subject || !args.year) throw new Error('Usage: --questions <path> --subject <slug> --year <number> [--stream natural|social]');
    if (args.stream && args.stream !== 'natural' && args.stream !== 'social') {
      throw new Error('--stream must be "natural" or "social"');
    }
    await importQuestions(resolve(args.questions), args.subject, Number(args.year), args.stream as Stream | undefined);
  } else if (args.lesson) {
    if (!args.lessonId) throw new Error('Usage: --lesson <path> --lessonId <id>');
    await importLesson(resolve(args.lesson), args.lessonId);
  } else if (args.textbook) {
    if (!args.subject) throw new Error('Usage: --textbook <path> --subject <slug>');
    await importTextbook(resolve(args.textbook), args.subject);
  } else {
    throw new Error(
      'Usage: --questions <path> --subject <slug> --year <number>  OR  --lesson <path> --lessonId <id>  OR  --textbook <path> --subject <slug>'
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
