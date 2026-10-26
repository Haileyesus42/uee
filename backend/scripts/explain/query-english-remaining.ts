import { prisma } from '../../src/lib/prisma';

const ANSWER_PREFIX =
  /^(correct answer is|the answer is|answer\s*[:\-]|option\s*\(?[a-d]\)?\s*is\s*correct|\(?[a-d]\)?\s*is\s*(the\s*)?correct)/i;

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function isWeak(explanation: string): boolean {
  const trimmed = explanation.trim();
  if (trimmed.length === 0 || trimmed.startsWith('(no explanation available')) return true;
  const words = wordCount(trimmed);
  if (ANSWER_PREFIX.test(trimmed) && words <= 15) return true;
  if (words <= 6) return true;
  return false;
}

async function main() {
  const subject = await prisma.subject.findUnique({ where: { slug: 'english' } });
  if (!subject) throw new Error('no english subject');

  const questions = await prisma.question.findMany({
    where: { subjectId: subject.id, examYear: { not: null } },
    select: {
      id: true,
      prompt: true,
      options: true,
      correctIndex: true,
      explanation: true,
      examYear: true,
      stream: true,
    },
    orderBy: { examYear: 'asc' },
  });

  const weak = questions.filter((q) => isWeak(q.explanation));
  const seenPrompts = new Set<string>();
  const deduped = weak.filter((q) => {
    if (seenPrompts.has(q.prompt)) return false;
    seenPrompts.add(q.prompt);
    return true;
  });

  console.log(JSON.stringify(deduped, null, 2));
  console.error(`\nTotal weak: ${weak.length}, deduped: ${deduped.length}`);
}
main().finally(() => prisma.$disconnect());
