// Batch-embeds existing Question and LessonStep content for Unity chat's
// Tier-2 retrieval (docs/backend-architecture.md §9, revived this session —
// see src/lib/embeddings.ts). Run once after the content_embeddings migration
// exists, and re-run any time to pick up new/changed content — contentHash
// means already-embedded, unchanged rows are skipped, not re-processed.
//
// Deliberately NOT embedding TextbookSection: per docs/library-inventory.md
// (2026-10-22), all 63 published books were converted to facsimile (page-image)
// editions, so the overwhelming majority of TextbookSection rows now carry only
// an image block + a "Page N" caption — there is no real text left to embed for
// most of them. Question.prompt/explanation and LessonStep.content are both
// unaffected by that conversion (separate content models) and are where the
// actual searchable curriculum text still lives.
//
// Usage: npx tsx scripts/ingest/embedContent.ts
import { prisma } from '../../src/lib/prisma';
import { embedText, hashContent, upsertContentEmbedding, getExistingContentHash } from '../../src/lib/embeddings';

function questionText(q: { prompt: string; explanation: string }): string {
  return `${q.prompt}\n${q.explanation}`;
}

// LessonStep.content is a tagged-union JSON blob (explanation/example/question
// shapes — see schema.prisma's comment on LessonStep.content and the original
// design doc §4) — pull out whichever text fields that step's type actually has
// rather than assuming one fixed shape.
function lessonStepText(content: unknown): string | null {
  if (typeof content !== 'object' || content === null) return null;
  const c = content as Record<string, unknown>;
  const parts = [c.heading, c.body, c.prompt, c.explanation, c.hint]
    .filter((v): v is string => typeof v === 'string' && v.length > 0);
  return parts.length > 0 ? parts.join('\n') : null;
}

async function embedBatch<T extends { id: string }>(
  sourceType: 'question' | 'lesson_step',
  rows: T[],
  getText: (row: T) => string | null
): Promise<{ embedded: number; skipped: number; empty: number }> {
  let embedded = 0;
  let skipped = 0;
  let empty = 0;

  for (const row of rows) {
    const text = getText(row);
    if (!text) {
      empty += 1;
      continue;
    }
    const contentHash = hashContent(text);
    const existingHash = await getExistingContentHash(sourceType, row.id);
    if (existingHash === contentHash) {
      skipped += 1;
      continue;
    }
    const embedding = await embedText(text);
    await upsertContentEmbedding(sourceType, row.id, contentHash, embedding);
    embedded += 1;
  }

  return { embedded, skipped, empty };
}

async function main() {
  console.log('Embedding questions...');
  const questions = await prisma.question.findMany({ select: { id: true, prompt: true, explanation: true } });
  const qResult = await embedBatch('question', questions, questionText);
  console.log(`questions: ${qResult.embedded} embedded, ${qResult.skipped} unchanged/skipped, ${qResult.empty} empty`);

  console.log('Embedding lesson steps...');
  const steps = await prisma.lessonStep.findMany({ select: { id: true, content: true } });
  const sResult = await embedBatch('lesson_step', steps, (s) => lessonStepText(s.content));
  console.log(`lesson steps: ${sResult.embedded} embedded, ${sResult.skipped} unchanged/skipped, ${sResult.empty} empty`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
