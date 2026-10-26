// Phase 1 of the AI-handover export: read-only inspection. Prints row counts
// per table and a few cross-checks. Makes no writes, prints no credentials.
import 'dotenv/config';
import { prisma } from '../../src/lib/prisma';

async function main() {
  const [
    users,
    subjects,
    units,
    lessons,
    lessonSteps,
    questions,
    questionsWithExamYear,
    questionsWithNullAnswer,
    textbookSections,
    teacherGuideSections,
    quizAttempts,
    quizAttemptAnswers,
    subscriptions,
    telebirrSubmissions,
    chatMessages,
    bookmarks,
    highlights,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subject.count(),
    prisma.unit.count(),
    prisma.lesson.count(),
    prisma.lessonStep.count(),
    prisma.question.count(),
    prisma.question.count({ where: { examYear: { not: null } } }),
    prisma.question.count({ where: { correctIndex: null } }),
    prisma.textbookSection.count({ where: { kind: 'TEXTBOOK' } }),
    prisma.textbookSection.count({ where: { kind: 'TEACHER_GUIDE' } }),
    prisma.quizAttempt.count(),
    prisma.quizAttemptAnswer.count(),
    prisma.subscription.count(),
    prisma.telebirrSubmission.count(),
    prisma.chatMessage.count(),
    prisma.userBookmark.count(),
    prisma.userHighlight.count(),
  ]);

  console.log('=== Educational content (export target) ===');
  console.log('subjects:', subjects);
  console.log('units:', units);
  console.log('lessons:', lessons);
  console.log('lesson_steps:', lessonSteps);
  console.log('questions (total):', questions, `(${questionsWithExamYear} past-paper, ${questions - questionsWithExamYear} practice-bank, ${questionsWithNullAnswer} with no answer key)`);
  console.log('textbook_sections (TEXTBOOK):', textbookSections);
  console.log('textbook_sections (TEACHER_GUIDE):', teacherGuideSections);

  console.log('\n=== User / auth / payment data (EXCLUDED from AI export, backup-only) ===');
  console.log('users:', users);
  console.log('quiz_attempts:', quizAttempts);
  console.log('quiz_attempt_answers:', quizAttemptAnswers);
  console.log('subscriptions:', subscriptions);
  console.log('telebirr_submissions:', telebirrSubmissions, '(includes raw payment screenshot bytes)');
  console.log('chat_messages:', chatMessages);
  console.log('user_bookmarks:', bookmarks);
  console.log('user_highlights:', highlights);

  const subjectBreakdown = await prisma.subject.findMany({
    select: { slug: true, name: true, streams: true, _count: { select: { questions: true, units: true, textbookSections: true } } },
    orderBy: { slug: 'asc' },
  });
  console.log('\n=== Per-subject breakdown ===');
  for (const s of subjectBreakdown) {
    console.log(`  ${s.slug.padEnd(20)} questions=${s._count.questions} units=${s._count.units} textbookSections=${s._count.textbookSections} streams=${s.streams.join(',') || '-'}`);
  }

  const examYears = await prisma.question.groupBy({
    by: ['examYear', 'stream'],
    where: { examYear: { not: null } },
    _count: true,
    orderBy: [{ examYear: 'asc' }],
  });
  console.log('\n=== Past-paper coverage (examYear x stream) ===');
  for (const row of examYears) {
    console.log(`  ${row.examYear} ${row.stream}: ${row._count}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
