import type { FastifyInstance } from 'fastify';
import { Stream } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../plugins/authenticate';
import { pickUniqueQuestions } from '../practice/routes';

const QUESTIONS_PER_PAPER = 10;

const STREAMS: { id: Stream; label: string }[] = [
  { id: 'natural', label: 'Natural Science' },
  { id: 'social', label: 'Social Science' },
];

export async function ueeRoutes(app: FastifyInstance) {
  app.get('/uee/streams', { preHandler: authenticate }, async () => STREAMS);

  app.get('/uee/years', { preHandler: authenticate }, async () => {
    // Only years that actually have an ingested past paper. The picker used to
    // list 22 years regardless of the data, so every one of them silently served
    // the 3–5 question practice fallback — advertising papers that don't exist.
    const rows = await prisma.question.findMany({
      where: { examYear: { not: null } },
      select: { examYear: true },
      distinct: ['examYear'],
      orderBy: { examYear: 'desc' },
    });
    return rows.map((r) => r.examYear).filter((y): y is number => y !== null);
  });

  app.get<{ Params: { stream: Stream } }>(
    '/uee/:stream/subjects',
    { preHandler: authenticate },
    async (request, reply) => {
      const { stream } = request.params;
      if (!STREAMS.some((s) => s.id === stream)) return reply.code(404).send({ error: 'Unknown stream' });

      const subjects = await prisma.subject.findMany({ where: { streams: { has: stream } } });
      return subjects.map((s) => ({ id: s.id, slug: s.slug, name: s.name, icon: s.icon }));
    }
  );

  app.get<{ Params: { stream: Stream; year: string; subjectId: string } }>(
    '/uee/:stream/:year/:subjectId/questions',
    { preHandler: authenticate },
    async (request) => {
      const { stream, subjectId, year } = request.params;

      // Prefer the real archive (questions ingested from that year's actual past
      // paper — see backend/scripts/ingest/) when it exists. Falls back to the
      // generic practice bank for years/streams that haven't been ingested yet, so
      // every year in the picker is still usable rather than erroring out.
      // No `take` cap on the archive: it's a real historical paper, so its
      // question count is however many questions that paper actually had (e.g.
      // 98 for biology 2025) — capping it silently truncated real papers down to
      // QUESTIONS_PER_PAPER.
      const archived = await prisma.question.findMany({
        where: { subjectId, examYear: Number(year), stream },
      });
      const questions = archived.length > 0 ? archived : await pickUniqueQuestions(subjectId, QUESTIONS_PER_PAPER);

      return questions.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      }));
    }
  );

  app.post<{ Params: { stream: Stream; year: string; subjectId: string } }>(
    '/uee/:stream/:year/:subjectId/exam',
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
