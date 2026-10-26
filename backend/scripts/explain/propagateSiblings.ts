// Duplicate questions (identical prompt+options, different ids) are reused
// across exam-year papers. Every explanation-generation batch in this effort
// deduped by prompt text before processing, so a fix only ever reached the
// one sampled id per unique question — sibling rows elsewhere in the archive
// kept their old placeholder/restates-answer text. This is a pure propagation
// pass: for every group of rows sharing identical prompt+options, if at least
// one has a real (non-weak) explanation, copy it to any sibling still showing
// a weak one. No new content is generated — this only ever copies an
// already-verified explanation onto rows that are, by definition, the exact
// same question.
//
// Usage:
//   npm run explain:propagate -- --dry-run
//   npm run explain:propagate
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  const dryRun = process.argv.includes('--dry-run');

  const questions = await prisma.question.findMany({
    where: { examYear: { not: null } },
    select: { id: true, prompt: true, options: true, explanation: true, subject: { select: { slug: true } } },
  });

  const groups = new Map<string, typeof questions>();
  for (const q of questions) {
    const key = `${q.prompt}\u0000${JSON.stringify(q.options)}`;
    const list = groups.get(key) ?? [];
    list.push(q);
    groups.set(key, list);
  }

  let groupsWithFix = 0;
  let rowsToUpdate = 0;
  const updates: { id: string; from: string; to: string; subject: string }[] = [];

  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const good = group.find((q) => !isWeak(q.explanation));
    if (!good) continue;

    const weakSiblings = group.filter((q) => q.id !== good.id && isWeak(q.explanation));
    if (weakSiblings.length === 0) continue;

    groupsWithFix += 1;
    for (const sib of weakSiblings) {
      rowsToUpdate += 1;
      updates.push({ id: sib.id, from: sib.explanation, to: good.explanation, subject: sib.subject.slug });
    }
  }

  const bySubject = new Map<string, number>();
  for (const u of updates) bySubject.set(u.subject, (bySubject.get(u.subject) ?? 0) + 1);

  console.log(`${groupsWithFix} question group(s) have a fix to propagate, ${rowsToUpdate} sibling row(s) to update.`);
  console.log('By subject:', Object.fromEntries(bySubject));

  if (dryRun) {
    console.log('\n--dry-run: no writes made. Sample of planned updates:');
    for (const u of updates.slice(0, 5)) {
      console.log(`  [${u.subject}] ${u.id}: "${u.from.slice(0, 50)}..." -> "${u.to.slice(0, 80)}..."`);
    }
    return;
  }

  let applied = 0;
  for (const u of updates) {
    const result = await prisma.question.updateMany({
      where: { id: u.id, explanation: u.from },
      data: { explanation: u.to },
    });
    if (result.count === 1) applied += 1;
  }
  console.log(`\nApplied: ${applied} of ${rowsToUpdate}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
