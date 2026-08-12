import type { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../plugins/authenticate';
import { pickQuestions } from '../practice/routes';

const QUESTIONS_PER_PAPER = 10;
const YEAR_COUNT = 22;

export async function ueeRoutes(app: FastifyInstance) {
  app.get('/uee/years', { preHandler: authenticate }, async () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: YEAR_COUNT }, (_, i) => currentYear - i);
  });

  app.get<{ Params: { year: string; subjectId: string } }>(
    '/uee/:year/:subjectId/questions',
    { preHandler: authenticate },
    async (request) => {
      // Papers reuse the practice question bank per subject — no distinct per-year
      // archive yet (matches getPaperQuestions() in the current mock data; see
      // docs/backend-architecture.md §4 and Phase 3 for the real archive).
      const questions = await pickQuestions(request.params.subjectId, QUESTIONS_PER_PAPER);
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
