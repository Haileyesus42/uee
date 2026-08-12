import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../plugins/authenticate';
import { awardXp } from '../../lib/gamification';

const questionsQuery = z.object({
  subjectId: z.string().min(1),
  count: z.coerce.number().int().min(1).max(50).default(10),
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

// Cycles through the bank when more questions are requested than exist — matches
// getPracticeQuestions()'s modulo behavior in the current mock data.
export async function pickQuestions(subjectId: string, count: number) {
  const bank = await prisma.question.findMany({ where: { subjectId } });
  if (bank.length === 0) return [];
  return Array.from({ length: count }, (_, i) => bank[i % bank.length]);
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
