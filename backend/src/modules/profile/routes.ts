import type { FastifyInstance } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../plugins/authenticate';
import { computeAvailableHearts } from '../../lib/gamification';
import { xpToLevel } from '../../lib/leveling';
import { MOTIVATIONAL_QUOTES } from '../../data/motivationalQuotes';

const ALLOWED_AVATAR_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const patchBody = z.object({
  name: z.string().min(1).max(80).optional(),
  grade: z.number().int().min(9).max(12).optional(),
  avatarEmoji: z.string().min(1).max(8).optional(),
});

async function buildProfilePayload(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const stats = await prisma.userStats.findUnique({ where: { userId } });

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
    hasAvatarPhoto: user.avatarUpload != null || user.avatarFileId != null,
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

  app.post('/me/avatar', { preHandler: authenticate }, async (request, reply) => {
    let file: MultipartFile | undefined;
    let buffer: Buffer | undefined;

    for await (const part of request.parts()) {
      if (part.type === 'file' && part.fieldname === 'avatar' && !buffer) {
        file = part;
        buffer = await part.toBuffer();
      } else if (part.type === 'file') {
        await part.toBuffer();
      }
    }

    if (!file || !buffer) return reply.code(400).send({ error: 'Missing "avatar" file.' });
    if (!ALLOWED_AVATAR_MIME.has(file.mimetype)) {
      return reply.code(400).send({ error: 'Avatar must be a JPEG, PNG, or WebP image.' });
    }

    await prisma.user.update({
      where: { id: request.userId },
      data: { avatarUpload: buffer, avatarUploadType: file.mimetype },
    });
    return buildProfilePayload(request.userId);
  });

  app.delete('/me/avatar', { preHandler: authenticate }, async (request) => {
    await prisma.user.update({
      where: { id: request.userId },
      data: { avatarUpload: null, avatarUploadType: null },
    });
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

  app.get('/me/notifications', { preHandler: authenticate }, async (request) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: request.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unreadCount = await prisma.notification.count({ where: { userId: request.userId, read: false } });
    return { notifications, unreadCount };
  });

  app.post('/me/notifications/read-all', { preHandler: authenticate }, async (request) => {
    await prisma.notification.updateMany({ where: { userId: request.userId, read: false }, data: { read: true } });
    return { ok: true };
  });

  // ── Motivation banner — ONE message per app-opening session ──────────────
  // Priority: countdown → last lesson → last practice → last mock → quote.
  // Every branch reflects actual data; nothing is invented. Falls through
  // gracefully when the student has no activity yet.
  app.get('/me/motivation', { preHandler: authenticate }, async (request) => {
    const userId = request.userId;
    const daysParam = (request.query as { daysUntilExam?: string }).daysUntilExam;
    const daysUntilExam = daysParam != null ? Number(daysParam) : null;

    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000,
    );
    const userHash = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const rotationIdx = (userHash + dayOfYear) % 1000;

    // Priority 1 — countdown
    if (daysUntilExam !== null && daysUntilExam >= 0) {
      if (daysUntilExam === 0) {
        return {
          type: 'countdown',
          emoji: '🔥',
          title: 'Exam day',
          message: 'Today is the day. Stay calm, read carefully, trust your preparation.',
        };
      }
      const weekEst = Math.max(1, Math.round(daysUntilExam / 7));
      const mockTarget = Math.max(1, Math.floor(daysUntilExam / 14));
      const framings = [
        {
          title: `${daysUntilExam} days to go`,
          message: `That is about ${weekEst} weeks. Every focused session counts.`,
        },
        {
          title: `${daysUntilExam} days until UEE`,
          message: `Aim for ${mockTarget} full mock exams this week to build stamina.`,
        },
        {
          title: `${daysUntilExam} days left`,
          message: 'Spend today on your weakest subject. Progress there pays the most.',
        },
        {
          title: `${daysUntilExam} days remain`,
          message: 'Review past mistakes before learning new topics. What you got wrong teaches more.',
        },
      ];
      const f = framings[rotationIdx % framings.length];
      return { type: 'countdown', emoji: '⏳', ...f };
    }

    // Priority 2 — last completed lesson
    const lastLesson = await prisma.userLessonProgress.findFirst({
      where: { userId, status: 'completed', completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      include: {
        lesson: {
          include: {
            unit: { include: { subject: { select: { name: true } } } },
          },
        },
      },
    });
    if (lastLesson?.lesson) {
      const subjectName = lastLesson.lesson.unit?.subject?.name ?? 'your last subject';
      const lessonTitle = lastLesson.lesson.title;
      const lessons = [
        {
          title: 'Welcome back',
          message: `Your last lesson was ${subjectName}: ${lessonTitle}. Ready to continue?`,
        },
        {
          title: 'Pick up where you left off',
          message: `Continue ${subjectName}: ${lessonTitle}. Momentum matters.`,
        },
        {
          title: 'Keep the streak going',
          message: `You finished ${lessonTitle}. Next up — one more lesson today.`,
        },
      ];
      const l = lessons[rotationIdx % lessons.length];
      return { type: 'lesson', emoji: '📚', ...l };
    }

    // Priority 3 — last practice score
    const lastPractice = await prisma.quizAttempt.findFirst({
      where: { userId, submittedAt: { not: null }, mode: 'practice' },
      orderBy: { submittedAt: 'desc' },
      include: { answers: { select: { correct: true } } },
    });
    if (lastPractice && lastPractice.answers.length > 0) {
      const correct = lastPractice.answers.filter((a) => a.correct).length;
      const pct = Math.round((correct / lastPractice.answers.length) * 100);
      const framing =
        pct >= 90
          ? { title: 'Excellent', message: `You scored ${pct}% in your last practice. Keep that edge.` }
          : pct >= 75
            ? { title: 'Strong progress', message: `You scored ${pct}% in your last practice. A few more reps and you are there.` }
            : pct >= 60
              ? { title: 'Solid', message: `You scored ${pct}% last practice. Focus on what you missed and retry.` }
              : { title: 'Room to grow', message: `You scored ${pct}% last practice. Review the ones you missed — they are your fastest wins.` };
      return { type: 'practice', emoji: '🎯', ...framing };
    }

    // Priority 4 — last mock exam
    const lastExam = await prisma.quizAttempt.findFirst({
      where: { userId, submittedAt: { not: null }, mode: 'mock' },
      orderBy: { submittedAt: 'desc' },
      include: { answers: { select: { correct: true } } },
    });
    if (lastExam && lastExam.answers.length > 0) {
      const correct = lastExam.answers.filter((a) => a.correct).length;
      const pct = Math.round((correct / lastExam.answers.length) * 100);
      return {
        type: 'exam',
        emoji: '🏆',
        title: 'Mock exam',
        message: `Your last mock score was ${pct}%. ${pct < 80 ? 'Let us aim higher this time.' : 'Stay sharp and aim higher.'}`,
      };
    }

    // Priority 5 — rotating quote (deterministic; no per-user state)
    const quote = MOTIVATIONAL_QUOTES[rotationIdx % MOTIVATIONAL_QUOTES.length];
    return { type: 'quote', emoji: '✨', title: 'A thought for today', message: quote };
  });
}