import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../plugins/authenticate';
import { computeAvailableHearts } from '../../lib/gamification';
import { xpToLevel } from '../../lib/leveling';

const patchBody = z.object({
  name: z.string().min(1).max(80).optional(),
  grade: z.number().int().min(9).max(12).optional(),
  avatarEmoji: z.string().min(1).max(8).optional(),
});

async function buildProfilePayload(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const stats = await prisma.userStats.findUnique({ where: { userId } });

  // "Questions solved" and accuracy combine two sources on purpose: quiz-attempt
  // answers (Practice/Mock/UEE) AND lesson question-steps (UserLessonProgress).
  // Counting only the former was a real bug — a student who answers a lesson
  // question correctly saw it nowhere in their own stats.
  const answers = await prisma.quizAttemptAnswer.findMany({
    where: { attempt: { userId } },
    select: { correct: true },
  });
  const quizCorrect = answers.filter((a) => a.correct).length;

  const completedLessons = await prisma.userLessonProgress.findMany({
    where: { userId, status: 'completed' },
    select: { firstAttemptCorrectCount: true, totalQuestionSteps: true },
  });
  const lessonQuestions = completedLessons.reduce((sum, l) => sum + l.totalQuestionSteps, 0);
  const lessonCorrect = completedLessons.reduce((sum, l) => sum + l.firstAttemptCorrectCount, 0);

  const questionsSolved = answers.length + lessonQuestions;
  const accuracy = questionsSolved === 0 ? 0 : (quizCorrect + lessonCorrect) / questionsSolved;

  const lessonsCompleted = completedLessons.length;

  const submittedAttempts = await prisma.quizAttempt.findMany({
    where: { userId, submittedAt: { not: null } },
    select: { timeSpentSeconds: true, source: true },
  });
  const studyTimeSeconds = submittedAttempts.reduce((sum, a) => sum + (a.timeSpentSeconds ?? 0), 0);
  const ueeExamsCompleted = submittedAttempts.filter((a) => a.source === 'uee_exam').length;

  const xp = stats?.xp ?? 0;
  const { level, levelTitle } = xpToLevel(xp);

  return {
    id: user.id,
    telegramId: user.telegramId,
    telegramUsername: user.telegramUsername,
    name: user.name,
    avatarEmoji: user.avatarEmoji,
    hasAvatarPhoto: user.avatarFileId != null,
    bio: user.bio,
    birthday:
      user.birthdayDay != null && user.birthdayMonth != null
        ? { day: user.birthdayDay, month: user.birthdayMonth, year: user.birthdayYear }
        : null,
    languageCode: user.languageCode,
    isPremium: user.isPremium,
    grade: user.grade,
    xp,
    streakDays: stats?.streakDays ?? 0,
    hearts: stats ? computeAvailableHearts(stats.hearts, stats.heartsRegenAt) : 5,
    level,
    levelTitle,
    accuracy,
    questionsSolved,
    studyTimeSeconds,
    lessonsCompleted,
    ueeExamsCompleted,
  };
}

export async function profileRoutes(app: FastifyInstance) {
  app.get('/me', { preHandler: authenticate }, async (request) => buildProfilePayload(request.userId));

  app.patch('/me', { preHandler: authenticate }, async (request) => {
    const body = patchBody.parse(request.body);
    await prisma.user.update({ where: { id: request.userId }, data: body });
    return buildProfilePayload(request.userId);
  });

  app.get('/me/mistakes', { preHandler: authenticate }, async (request) => {
    const wrongAnswers = await prisma.quizAttemptAnswer.findMany({
      where: { correct: false, attempt: { userId: request.userId } },
      include: { question: { include: { subject: true } } },
      orderBy: { attempt: { submittedAt: 'desc' } },
      take: 50,
    });

    const seenQuestionIds = new Set<string>();
    const mistakes = [];
    for (const wrong of wrongAnswers) {
      if (seenQuestionIds.has(wrong.questionId)) continue;
      seenQuestionIds.add(wrong.questionId);
      mistakes.push({
        subject: wrong.question.subject.name,
        question: {
          prompt: wrong.question.prompt,
          options: wrong.question.options,
          correctIndex: wrong.question.correctIndex,
          explanation: wrong.question.explanation,
        },
      });
      if (mistakes.length >= 20) break;
    }

    return mistakes;
  });
}
