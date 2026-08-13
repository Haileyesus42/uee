import type { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../plugins/authenticate';
import { pickUniqueQuestions } from '../practice/routes';

const QUESTIONS_PER_PAPER = 10;
const YEAR_COUNT = 22;

export async function ueeRoutes(app: FastifyInstance) {
  app.get('/uee/years', { preHandler: authenticate }, async () => {
    // Starts at last year, not the current (still in progress) year — a paper
    // for a UEE sitting that hasn't happened yet isn't a "past" paper.
    const lastCompletedYear = new Date().getFullYear() - 1;
    return Array.from({ length: YEAR_COUNT }, (_, i) => lastCompletedYear - i);
  });

  app.get<{ Params: { year: string; subjectId: string } }>(
    '/uee/:year/:subjectId/questions',
    { preHandler: authenticate },
    async (request) => {
      // Papers reuse the practice question bank per subject — no distinct per-year
      // archive yet (see docs/backend-architecture.md §4 and Phase 3 for the real
      // archive). Capped, not cycled, so a short bank yields a short paper instead
      // of visibly repeating the same question twice.
      const questions = await pickUniqueQuestions(request.params.subjectId, QUESTIONS_PER_PAPER);
      return questions.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      }));
    }
  );

  app.post<{ Params: { year: string; subjectId: string } }>(
    '/uee/:year/:subjectId/exam',
    { preHandler: authenticate },
    async (request) => {
      const attempt = await prisma.quizAttempt.create({
        data: {
          userId: request.userId,
          mode: 'mock',
          source: 'uee_exam',
          subjectId: request.params.subjectId,
          pastPaperYear: Number(request.params.year),
        },
      });
      return { id: attempt.id };
    }
  );
}
