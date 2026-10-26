import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../plugins/authenticate';
import { awardXp } from '../../lib/gamification';

const questionsQuery = z.object({
  subjectId: z.string().min(1),
  // 100 comfortably covers every real UEE paper length (English's 60 is the
  // longest configured, see MockExamsListScreen's EXAM_CONFIG) with headroom —
  // was capped at 50, which rejected a full-length English mock outright.
  count: z.coerce.number().int().min(1).max(100).default(10),
});

const startAttemptBody = z.object({
  mode: z.enum(['practice', 'mock']),
  source: z.enum(['practice', 'uee_exam']).default('practice'),
  subjectId: z.string().min(1),
  topic: z.string().optional(),
  pastPaperYear: z.number().int().optional(),
});

const answerBody = z.object({
  questionId: z.string().min(1),
  // -1 means "no answer" (e.g. a timed mock exam question the clock ran out on) —
  // never equals a real correctIndex, so it naturally scores as incorrect.
  selectedIndex: z.number().int().min(-1),
});

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// A random sample, not the same first-N-by-insertion-order every time — a
// "full-length mock exam" that shows byte-identical questions on every retake
// isn't actually simulating a new exam. Re-shuffles per lap when more questions
// are requested than exist, so even the cycled case doesn't fall into a visibly
// repeating pattern. NOT used for UEE papers (see pickUniqueQuestions) — a real
// past exam has a fixed, real order that shouldn't be shuffled.
export async function pickQuestions(subjectId: string, count: number) {
  const bank = await prisma.question.findMany({ where: { subjectId } });
  if (bank.length === 0) return [];
  const picked: typeof bank = [];
  while (picked.length < count) picked.push(...shuffled(bank));
  return picked.slice(0, count);
}

// Caps at the bank's real size instead of cycling — a paper is shorter than
// `maxCount` when the underlying question bank doesn't have enough unique
// questions yet, rather than silently padding it out with repeats.
export async function pickUniqueQuestions(subjectId: string, maxCount: number) {
  const bank = await prisma.question.findMany({ where: { subjectId } });
  return bank.slice(0, maxCount);
}

export async function practiceRoutes(app: FastifyInstance) {
  app.get('/practice/questions', { preHandler: authenticate }, async (request) => {
    const { subjectId, count } = questionsQuery.parse(request.query);
    const questions = await pickQuestions(subjectId, count);
    return questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
    }));
  });

  app.post('/quiz-attempts', { preHandler: authenticate }, async (request) => {
    const body = startAttemptBody.parse(request.body);
    const attempt = await prisma.quizAttempt.create({
      data: { userId: request.userId, ...body },
    });
    return { id: attempt.id };
  });

  app.patch<{ Params: { id: string } }>(
    '/quiz-attempts/:id/answers',
    { preHandler: authenticate },
    async (request, reply) => {
      const { questionId, selectedIndex } = answerBody.parse(request.body);
      const attempt = await prisma.quizAttempt.findUnique({ where: { id: request.params.id } });
      if (!attempt || attempt.userId !== request.userId) {
        return reply.code(404).send({ error: 'Attempt not found' });
      }

      const question = await prisma.question.findUnique({ where: { id: questionId } });
      if (!question) return reply.code(404).send({ error: 'Question not found' });

      // Questions imported without an answer key can be read and answered but
      // never scored — recording them as `correct: false` would punish the
      // student for a key the source never published.
      if (question.correctIndex === null) {
        return reply.send({ ok: true, correct: null });
      }

      const correct = selectedIndex === question.correctIndex;
      await prisma.quizAttemptAnswer.upsert({
        where: { attemptId_questionId: { attemptId: attempt.id, questionId } },
        create: { attemptId: attempt.id, questionId, selectedIndex, correct },
        update: { selectedIndex, correct },
      });

      return reply.send({ ok: true, correct });
    }
  );

  app.post<{ Params: { id: string } }>(
    '/quiz-attempts/:id/submit',
    { preHandler: authenticate },
    async (request, reply) => {
      const attempt = await prisma.quizAttempt.findUnique({
        where: { id: request.params.id },
        include: { answers: { include: { question: true } } },
      });
      if (!attempt || attempt.userId !== request.userId) {
        return reply.code(404).send({ error: 'Attempt not found' });
      }

      const submittedAt = new Date();
      const timeSpentSeconds = Math.max(0, Math.round((submittedAt.getTime() - attempt.startedAt.getTime()) / 1000));
      await prisma.quizAttempt.update({
        where: { id: attempt.id },
        data: { submittedAt, timeSpentSeconds },
      });

      const correctCount = attempt.answers.filter((a) => a.correct).length;
      const totalQuestions = attempt.answers.length;

      const xpPerCorrect = attempt.mode === 'mock' ? 8 : 5;
      const xp = correctCount * xpPerCorrect;
      if (xp > 0) {
        await awardXp(request.userId, xp, attempt.mode === 'mock' ? 'mock_exam' : 'quiz_correct');
      }

      return reply.send({
        correctCount,
        totalQuestions,
        timeSpentSeconds,
        xpAwarded: xp,
        reviewItems: attempt.answers.map((a) => ({
          questionId: a.questionId,
          prompt: a.question.prompt,
          options: a.question.options,
          correctIndex: a.question.correctIndex,
          selectedIndex: a.selectedIndex,
          explanation: a.question.explanation,
        })),
      });
    }
  );
}
