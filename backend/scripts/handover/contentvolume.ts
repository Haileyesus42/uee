// Read-only content-volume snapshot for the infra/profitability report. Uses the
// app's own Prisma client (guarantees we hit the actual configured DB, not a
// guessed container/port) and runs nothing but SELECT/count/aggregate queries.
import { prisma } from '../../src/lib/prisma';

async function main() {
  const [subjects, questions, textbookSections, lessons, lessonSteps, users, quizAttempts, chatMessages] =
    await Promise.all([
      prisma.subject.count(),
      prisma.question.count(),
      prisma.textbookSection.count(),
      prisma.lesson.count(),
      prisma.lessonStep.count(),
      prisma.user.count(),
      prisma.quizAttempt.count(),
      prisma.chatMessage.count(),
    ]);
  console.log({ subjects, questions, textbookSections, lessons, lessonSteps, users, quizAttempts, chatMessages });

  console.log('\n--- questions per subject (the full-bank-fetch cost driver) ---');
  const perSubject = await prisma.question.groupBy({ by: ['subjectId'], _count: true });
  const subjectNames = await prisma.subject.findMany({ select: { id: true, name: true } });
  const nameById = new Map(subjectNames.map((s) => [s.id, s.name]));
  for (const row of perSubject.sort((a, b) => b._count - a._count)) {
    console.log(`${nameById.get(row.subjectId) ?? row.subjectId}: ${row._count}`);
  }

  console.log('\n--- average row payload size (prompt+options+explanation), bytes ---');
  const sample = await prisma.question.findMany({ select: { prompt: true, options: true, explanation: true }, take: 500 });
  const avgBytes =
    sample.reduce((sum, q) => sum + Buffer.byteLength(q.prompt + JSON.stringify(q.options) + (q.explanation ?? ''), 'utf8'), 0) /
    sample.length;
  console.log(`avg question row ~${avgBytes.toFixed(0)} bytes (prompt+options+explanation only, sample of ${sample.length})`);

  console.log('\n--- actual Postgres on-disk table sizes ---');
  const sizes = await prisma.$queryRaw<{ table_name: string; size: string }[]>`
    SELECT relname AS table_name, pg_size_pretty(pg_total_relation_size(relid)) AS size
    FROM pg_catalog.pg_statio_user_tables
    ORDER BY pg_total_relation_size(relid) DESC
    LIMIT 20
  `;
  for (const row of sizes) console.log(`${row.table_name}: ${row.size}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
