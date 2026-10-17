import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { env } from '../../env';
import { authenticate } from '../../plugins/authenticate';
import { extractJsonFromImageBuffer } from '../../lib/groqVision';
import { notifyUpgrade } from '../../lib/notify';
import { sendTelegramMessage } from '../auth/telegramBot';
import { PRICE_ETB, DURATION_DAYS, addDays } from './plans';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SUBMISSIONS_PER_DAY = 5;

const extractionSchema = z
  .object({
    transactionRef: z.string().nullable().optional(),
    amountETB: z.number().nullable().optional(),
    receiverName: z.string().nullable().optional(),
    receiverPhone: z.string().nullable().optional(),
  })
  .partial();
type Extraction = z.infer<typeof extractionSchema>;

function buildPrompt(): string {
  return `This is a screenshot of a Telebirr (Ethio Telecom mobile money) payment confirmation. Read off it and return JSON exactly in this shape:
{"transactionRef": "<the transaction/receipt number, or null if not visible>", "amountETB": <the amount paid as a plain number in ETB, or null>, "receiverName": "<the name money was sent to, or null>", "receiverPhone": "<the phone number money was sent to, or null>"}
Only report what is actually printed on the screenshot — never guess or infer a value that isn't legible.`;
}

// Loose, typo/formatting-tolerant comparisons — screenshots render names/numbers
// inconsistently (spacing, "0" vs "+251", title-case vs caps) and the configured
// receiver is the ground truth either way, so a strict equality check would just
// generate false needs_review flags for genuine payments.
function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z]/g, '');
}
function normalizePhone(s: string): string {
  return s.replace(/\D/g, '').slice(-9);
}

type Decision = { status: 'approved' } | { status: 'needs_review'; reason: string };

// The only check that can ever auto-REJECT is the screenshot-hash uniqueness
// constraint, enforced earlier at the database layer before this ever runs —
// everything this function finds questionable goes to needs_review, never an
// automatic reject. An OCR misread burning a real payer with no recourse is a
// worse failure than one extra Telegram ping for the dev to glance at.
function evaluateExtraction(extracted: Extraction, plan: 'monthly' | 'yearly'): Decision {
  const priceETB = PRICE_ETB[plan];

  if (!extracted.transactionRef || extracted.amountETB == null) {
    return { status: 'needs_review', reason: "Couldn't read a transaction reference and amount off the screenshot." };
  }

  if (Math.abs(extracted.amountETB - priceETB) > 0.5) {
    return {
      status: 'needs_review',
      reason: `Screenshot shows ${extracted.amountETB} ETB, expected ${priceETB} ETB for the ${plan} plan.`,
    };
  }

  // A receiver match is required, not merely checked when both sides happen to
  // have a value — without this, a legible payment to literally anyone else would
  // auto-approve as long as the vision model simply failed to read a receiver off
  // the screenshot. Either name or phone matching is enough, since which one a
  // given Telebirr confirmation screen shows varies.
  const configuredName = env.TELEBIRR_RECEIVER_NAME ? normalizeName(env.TELEBIRR_RECEIVER_NAME) : null;
  const configuredPhone = env.TELEBIRR_RECEIVER_PHONE ? normalizePhone(env.TELEBIRR_RECEIVER_PHONE) : null;
  const screenshotName = extracted.receiverName ? normalizeName(extracted.receiverName) : null;
  const screenshotPhone = extracted.receiverPhone ? normalizePhone(extracted.receiverPhone) : null;

  const nameMatches = Boolean(configuredName && screenshotName && (screenshotName.includes(configuredName) || configuredName.includes(screenshotName)));
  const phoneMatches = Boolean(configuredPhone && screenshotPhone && configuredPhone === screenshotPhone);

  if (!nameMatches && !phoneMatches) {
    return {
      status: 'needs_review',
      reason:
        extracted.receiverName || extracted.receiverPhone
          ? `Receiver on screenshot ("${extracted.receiverName ?? extracted.receiverPhone}") doesn't match the configured Telebirr account.`
          : "Couldn't read who the screenshot's payment was sent to.",
    };
  }

  return { status: 'approved' };
}

async function activateFromSubmission(submission: { id: string; userId: string; plan: 'monthly' | 'yearly'; priceETB: number }) {
  const now = new Date();
  const expiresAt = addDays(now, DURATION_DAYS[submission.plan]);
  await prisma.subscription.upsert({
    where: { userId: submission.userId },
    create: {
      userId: submission.userId,
      plan: submission.plan,
      priceETB: submission.priceETB,
      status: 'active',
      provider: 'telebirr',
      providerRef: submission.id,
      startedAt: now,
      expiresAt,
    },
    update: {
      plan: submission.plan,
      priceETB: submission.priceETB,
      status: 'active',
      provider: 'telebirr',
      providerRef: submission.id,
      startedAt: now,
      expiresAt,
    },
  });
  await notifyUpgrade(submission.userId, submission.plan, expiresAt);
}

function requireAdminSecret(secret: unknown): boolean {
  return typeof secret === 'string' && env.ADMIN_SECRET.length > 0 && secret === env.ADMIN_SECRET;
}

export async function telebirrRoutes(app: FastifyInstance) {
  app.get('/billing/telebirr/info', { preHandler: authenticate }, async () => {
    if (!env.TELEBIRR_RECEIVER_PHONE) return { enabled: false as const };
    return {
      enabled: true as const,
      receiverPhone: env.TELEBIRR_RECEIVER_PHONE,
      receiverName: env.TELEBIRR_RECEIVER_NAME || null,
      priceETB: PRICE_ETB,
    };
  });

  app.get('/billing/telebirr/latest', { preHandler: authenticate }, async (request) => {
    const submission = await prisma.telebirrSubmission.findFirst({
      where: { userId: request.userId },
      orderBy: { createdAt: 'desc' },
    });
    if (!submission) return { submission: null };
    return {
      submission: {
        id: submission.id,
        status: submission.status,
        plan: submission.plan,
        priceETB: submission.priceETB,
        reviewNote: submission.reviewNote,
        createdAt: submission.createdAt,
      },
    };
  });

  app.post('/billing/telebirr/submit', { preHandler: authenticate }, async (request, reply) => {
    if (!env.TELEBIRR_RECEIVER_PHONE) {
      return reply.code(400).send({ error: 'Telebirr payment is not configured.' });
    }

    let plan: 'monthly' | 'yearly' | undefined;
    let file: MultipartFile | undefined;
    let buffer: Buffer | undefined;

    for await (const part of request.parts()) {
      if (part.type === 'file') {
        if (part.fieldname === 'screenshot' && !buffer) {
          file = part;
          buffer = await part.toBuffer();
        } else {
          await part.toBuffer(); // drain any other/duplicate file part
        }
      } else if (part.fieldname === 'plan' && (part.value === 'monthly' || part.value === 'yearly')) {
        plan = part.value;
      }
    }

    if (!plan) return reply.code(400).send({ error: 'Missing or invalid "plan" field.' });
    if (!file || !buffer) return reply.code(400).send({ error: 'Missing "screenshot" file.' });
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return reply.code(400).send({ error: 'Screenshot must be a JPEG, PNG, or WebP image.' });
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await prisma.telebirrSubmission.count({
      where: { userId: request.userId, createdAt: { gte: since } },
    });
    if (recentCount >= MAX_SUBMISSIONS_PER_DAY) {
      return reply.code(429).send({ error: 'Too many payment submissions today — please contact support for help.' });
    }

    // Checked before the Groq call, not just before saving — an exact-duplicate
    // image means there is nothing new to verify, so this also saves the request.
    const screenshotHash = crypto.createHash('sha256').update(buffer).digest('hex');
    const existing = await prisma.telebirrSubmission.findUnique({ where: { screenshotHash } });
    if (existing) {
      return reply.code(409).send({
        error: 'This screenshot has already been submitted.',
        status: existing.status,
        reviewNote: existing.reviewNote,
      });
    }

    const priceETB = PRICE_ETB[plan];
    let extracted: Extraction = {};
    let rawExtraction: unknown = null;
    try {
      rawExtraction = await extractJsonFromImageBuffer(buffer, file.mimetype, buildPrompt());
      const parsed = extractionSchema.safeParse(rawExtraction);
      if (parsed.success) extracted = parsed.data;
    } catch (err) {
      request.log.error(err, '[billing/telebirr] Groq extraction failed');
      // Fall through with an empty extraction — evaluateExtraction treats a missing
      // ref/amount as needs_review, which is the right outcome for "couldn't read
      // it" too, without a separate error path for the submitter to hit.
    }

    // A transaction reference already used on a different *approved* submission is
    // either a genuine re-send of the same receipt or a reused screenshot that
    // happened to get re-encoded (different hash, same underlying payment) —
    // either way a human should look, since only one of them is a real payment.
    let decision = evaluateExtraction(extracted, plan);
    if (decision.status === 'approved' && extracted.transactionRef) {
      const dupeRef = await prisma.telebirrSubmission.findFirst({
        where: { extractedRef: extracted.transactionRef, status: 'approved' },
      });
      if (dupeRef) {
        decision = {
          status: 'needs_review',
          reason: `Transaction reference "${extracted.transactionRef}" was already used on an approved payment.`,
        };
      }
    }

    const submission = await prisma.telebirrSubmission.create({
      data: {
        userId: request.userId,
        plan,
        priceETB,
        screenshot: buffer,
        screenshotType: file.mimetype,
        screenshotHash,
        extractedRef: extracted.transactionRef ?? null,
        extractedAmountETB: extracted.amountETB ?? null,
        extractedReceiver: extracted.receiverName ?? extracted.receiverPhone ?? null,
        rawExtraction: rawExtraction === null ? undefined : (rawExtraction as object),
        status: decision.status,
        reviewNote: decision.status === 'needs_review' ? decision.reason : null,
      },
    });

    if (decision.status === 'approved') {
      await activateFromSubmission(submission);
    } else if (env.ADMIN_TELEGRAM_CHAT_ID) {
      const chatId = Number(env.ADMIN_TELEGRAM_CHAT_ID);
      if (Number.isFinite(chatId)) {
        sendTelegramMessage(
          chatId,
          `Telebirr payment needs review (${submission.id}):\n${decision.reason}\nPlan: ${plan} (${priceETB} ETB)`
        ).catch((err) => request.log.error(err, '[billing/telebirr] admin notify failed'));
      }
    }

    return reply.send({ status: decision.status, reviewNote: decision.status === 'needs_review' ? decision.reason : null });
  });

  const reviewParams = z.object({ id: z.string().uuid() });
  const reviewBody = z.object({ approve: z.boolean(), note: z.string().optional() });

  app.post('/billing/telebirr/:id/review', async (request, reply) => {
    if (!requireAdminSecret(request.headers['x-admin-secret'])) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const { id } = reviewParams.parse(request.params);
    const { approve, note } = reviewBody.parse(request.body);

    const submission = await prisma.telebirrSubmission.findUnique({ where: { id } });
    if (!submission) return reply.code(404).send({ error: 'Not found' });
    if (submission.status !== 'needs_review') {
      return reply.code(409).send({ error: `Submission is already ${submission.status}.` });
    }

    if (approve) {
      await prisma.telebirrSubmission.update({
        where: { id },
        data: { status: 'approved', reviewNote: note ?? submission.reviewNote, reviewedAt: new Date() },
      });
      await activateFromSubmission(submission);
    } else {
      await prisma.telebirrSubmission.update({
        where: { id },
        data: { status: 'rejected', reviewNote: note ?? 'Rejected on manual review.', reviewedAt: new Date() },
      });
    }

    return reply.send({ ok: true });
  });

  // Secret as a query param, not a header, so the dev can just open this in a
  // browser tab to glance at the screenshot — it'll land in server access logs and
  // browser history as a result, an acceptable tradeoff for a low-traffic internal
  // review tool but worth knowing if ADMIN_SECRET is ever reused for anything else.
  const screenshotQuery = z.object({ secret: z.string() });

  app.get('/billing/telebirr/:id/screenshot', async (request, reply) => {
    const { id } = reviewParams.parse(request.params);
    const { secret } = screenshotQuery.parse(request.query);
    if (!requireAdminSecret(secret)) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const submission = await prisma.telebirrSubmission.findUnique({
      where: { id },
      select: { screenshot: true, screenshotType: true },
    });
    if (!submission) return reply.code(404).send({ error: 'Not found' });

    reply.header('Content-Type', submission.screenshotType);
    return reply.send(submission.screenshot);
  });
}
