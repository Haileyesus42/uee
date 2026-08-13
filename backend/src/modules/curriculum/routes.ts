import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../plugins/authenticate';
import { awardXp } from '../../lib/gamification';

const unitsQuery = z.object({ grade: z.coerce.number().int().min(9).max(12).optional() });
const progressBody = z.object({
  correctCount: z.number().int().min(0),
  totalSteps: z.number().int().min(1),
});

// Lessons unlock linearly: units ordered by `order`, lessons within a unit ordered by
// `order`. A user with no progress rows yet starts at the very first lesson of the
// subject ("current"); everything after it is "locked" until unlocked in sequence.
async function flattenedLessonIds(subjectId: string): Promise<string[]> {
  const units = await prisma.unit.findMany({
    where: { subjectId },
    orderBy: { order: 'asc' },
    include: { lessons: { orderBy: { order: 'asc' } } },
  });
  return units.flatMap((u) => u.lessons.map((l) => l.id));
}

export async function curriculumRoutes(app: FastifyInstance) {
  app.get('/subjects', { preHandler: authenticate }, async (request) => {
    const subjects = await prisma.subject.findMany({
      include: { units: { include: { lessons: true } } },
    });
    const progress = await prisma.userLessonProgress.findMany({ where: { userId: request.userId } });
    const progressByLessonId = new Map(progress.map((p) => [p.lessonId, p]));

    return subjects.map((s) => {
      const lessons = s.units.flatMap((u) => u.lessons);
      const total = lessons.length;
      const completed = lessons.filter((l) => progressByLessonId.get(l.id)?.status === 'completed').length;
      return {
        id: s.id,
        slug: s.slug,
        name: s.name,
        icon: s.icon,
        mastery: total === 0 ? 0 : completed / total,
      };
    });
  });

  app.get<{ Params: { id: string } }>('/subjects/:id/units', { preHandler: authenticate }, async (request, reply) => {
    const { grade } = unitsQuery.parse(request.query);
    const subject = await prisma.subject.findUnique({ where: { id: request.params.id } });
    if (!subject) return reply.code(404).send({ error: 'Subject not found' });

    const orderedLessonIds = await flattenedLessonIds(subject.id);
    const progress = await prisma.userLessonProgress.findMany({ where: { userId: request.userId } });
    const progressByLessonId = new Map(progress.map((p) => [p.lessonId, p]));
    const firstIncompleteIndex = orderedLessonIds.findIndex(
      (id) => progressByLessonId.get(id)?.status !== 'completed'
    );

    const units = await prisma.unit.findMany({
      where: { subjectId: subject.id, ...(grade ? { grade } : {}) },
      orderBy: { order: 'asc' },
      include: { lessons: { orderBy: { order: 'asc' } } },
    });

    return units.map((u) => ({
      id: u.id,
      title: u.title,
      description: u.description,
      grade: u.grade,
      lessons: u.lessons.map((l) => {
        const row = progressByLessonId.get(l.id);
        const index = orderedLessonIds.indexOf(l.id);
        const status = row?.status ?? (index === firstIncompleteIndex ? 'current' : 'locked');
        return { id: l.id, title: l.title, status };
      }),
    }));
  });

  app.get<{ Params: { id: string } }>('/lessons/:id', { preHandler: authenticate }, async (request, reply) => {
    const lesson = await prisma.lesson.findUnique({
      where: { id: request.params.id },
      include: { steps: { orderBy: { order: 'asc' } } },
    });
    if (!lesson) return reply.code(404).send({ error: 'Lesson not found' });

    return {
      id: lesson.id,
      title: lesson.title,
      steps: lesson.steps.map((s) => ({ type: s.type, ...(s.content as object) })),
    };
  });

  app.post<{ Params: { id: string } }>(
    '/lessons/:id/progress',
    { preHandler: authenticate },
    async (request, reply) => {
      const { correctCount, totalSteps } = progressBody.parse(request.body);
      const lesson = await prisma.lesson.findUnique({ where: { id: request.params.id }, include: { unit: true } });
      if (!lesson) return reply.code(404).send({ error: 'Lesson not found' });

      await prisma.userLessonProgress.upsert({
        where: { userId_lessonId: { userId: request.userId, lessonId: lesson.id } },
        create: {
          userId: request.userId,
          lessonId: lesson.id,
          status: 'completed',
          firstAttemptCorrectCount: correctCount,
          totalQuestionSteps: totalSteps,
          completedAt: new Date(),
        },
        update: {
          status: 'completed',
          firstAttemptCorrectCount: correctCount,
          totalQuestionSteps: totalSteps,
          completedAt: new Date(),
        },
      });

      const orderedLessonIds = await flattenedLessonIds(lesson.unit.subjectId);
      const nextLessonId = orderedLessonIds[orderedLessonIds.indexOf(lesson.id) + 1];
      if (nextLessonId) {
        await prisma.userLessonProgress.upsert({
          where: { userId_lessonId: { userId: request.userId, lessonId: nextLessonId } },
          create: { userId: request.userId, lessonId: nextLessonId, status: 'current' },
          update: {},
        });
      }

      const xp = 20 + Math.round((correctCount / totalSteps) * 30);
      await awardXp(request.userId, xp, 'lesson_complete');

      return reply.send({ ok: true, xpAwarded: xp });
    }
  );
}
