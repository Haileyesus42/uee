import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../plugins/authenticate';
import { paymentProvider, verifyChapaTransaction, verifyChapaWebhookSignature } from './paymentProvider';
import { PRICE_ETB, DURATION_DAYS, addDays } from './plans';
import { telebirrRoutes } from './telebirr';

const checkoutBody = z.object({ plan: z.enum(['monthly', 'yearly']) });

export async function billingRoutes(app: FastifyInstance) {
  // Scoped sub-plugin purely so the raw-string content-type parser below doesn't
  // leak out and affect JSON parsing for the rest of the app — Fastify plugin
  // registration is its own encapsulation boundary.
  await app.register(async (webhookApp) => {
    // Chapa signs the *exact bytes* it sent (see verifyChapaWebhookSignature) —
    // Fastify's default JSON parser discards those in favor of a parsed object,
    // and re-serializing with JSON.stringify isn't guaranteed to reproduce the
    // original bytes. This route gets the raw string instead and parses it
    // itself, after the signature check.
    webhookApp.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
      done(null, body);
    });

    webhookApp.post('/billing/webhook/chapa', async (request, reply) => {
      const rawBody = request.body as string;

      if (!verifyChapaWebhookSignature(rawBody, request.headers as Record<string, string | string[] | undefined>)) {
        request.log.warn('[billing] Chapa webhook signature verification failed — request discarded.');
        return reply.code(401).send({ error: 'Invalid signature' });
      }

      let parsed: { tx_ref?: string };
      try {
        parsed = JSON.parse(rawBody);
      } catch {
        return reply.code(400).send({ error: 'Invalid JSON body' });
      }

      const txRef = parsed.tx_ref;
      if (!txRef) return reply.code(400).send({ error: 'Missing tx_ref' });

      const subscription = await prisma.subscription.findUnique({ where: { providerRef: txRef } });
      if (!subscription) {
        // Ack anyway (200) — Chapa retries on non-2xx, and there's genuinely
        // nothing to retry into (no matching pending checkout for this tx_ref).
        request.log.warn(`[billing] Chapa webhook for unknown tx_ref "${txRef}"`);
        return reply.send({ ok: true });
      }

      // Idempotent — Chapa retries deliveries, this may be a duplicate for an
      // already-activated subscription.
      if (subscription.status === 'active') {
        return reply.send({ ok: true });
      }

      // Never trust the webhook payload's own status/amount — re-query Chapa
      // directly (docs/backend-architecture.md §11 + Chapa's own webhook docs).
      const verification = await verifyChapaTransaction(txRef);
      if (!verification.ok) {
        request.log.warn(`[billing] Chapa transaction ${txRef} did not verify as successful — not activating.`);
        return reply.send({ ok: true });
      }

      await prisma.subscription.update({ where: { providerRef: txRef }, data: { status: 'active' } });
      return reply.send({ ok: true });
    });
  });

  app.post('/billing/checkout', { preHandler: authenticate }, async (request, reply) => {
    const { plan } = checkoutBody.parse(request.body);
    const priceETB = PRICE_ETB[plan];

    const user = await prisma.user.findUniqueOrThrow({ where: { id: request.userId } });
    const result = await paymentProvider.initiateCheckout(request.userId, priceETB, {
      plan,
      // No real email exists to send — auth is Telegram-only (§5). Fine for
      // processing the charge; only matters if Chapa emails a receipt to it.
      email: `user-${request.userId}@compass.app`,
      firstName: user.name || 'Compass',
    });

    // Real Chapa checkouts start `pending` and only flip to `active` from the
    // signed webhook above — never from this response. The mock provider still
    // activates immediately (activateImmediately: true), same as before.
    // expiresAt is computed from *now*, not from webhook-confirmation time — a
    // deliberate simplification, since payment normally completes within
    // minutes of checkout; an abandoned pending checkout just never flips to
    // active; and retrying checkout overwrites it (upsert on userId).
    const now = new Date();
    await prisma.subscription.upsert({
      where: { userId: request.userId },
      create: {
        userId: request.userId,
        plan,
        priceETB,
        status: result.activateImmediately ? 'active' : 'pending',
        provider: paymentProvider.name,
        providerRef: result.providerRef,
        startedAt: now,
        expiresAt: addDays(now, DURATION_DAYS[plan]),
      },
      update: {
        plan,
        priceETB,
        status: result.activateImmediately ? 'active' : 'pending',
        provider: paymentProvider.name,
        providerRef: result.providerRef,
        startedAt: now,
        expiresAt: addDays(now, DURATION_DAYS[plan]),
      },
    });

    return reply.send({ redirectUrl: result.redirectUrl, activated: result.activateImmediately });
  });

  app.get('/billing/subscription', { preHandler: authenticate }, async (request) => {
    const subscription = await prisma.subscription.findUnique({ where: { userId: request.userId } });
    if (!subscription) return { status: 'none' as const };

    const isExpired = subscription.status === 'active' && subscription.expiresAt < new Date();
    return {
      status: isExpired ? ('expired' as const) : subscription.status,
      plan: subscription.plan,
      priceETB: subscription.priceETB,
      startedAt: subscription.startedAt,
      expiresAt: subscription.expiresAt,
    };
  });

  await app.register(telebirrRoutes);
}
