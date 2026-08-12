import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../plugins/authenticate';
import { paymentProvider } from './paymentProvider';

const PRICE_ETB: Record<'monthly' | 'yearly', number> = { monthly: 25, yearly: 250 };
const DURATION_DAYS: Record<'monthly' | 'yearly', number> = { monthly: 30, yearly: 365 };

const checkoutBody = z.object({ plan: z.enum(['monthly', 'yearly']) });

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export async function billingRoutes(app: FastifyInstance) {
  app.post('/billing/checkout', { preHandler: authenticate }, async (request, reply) => {
    const { plan } = checkoutBody.parse(request.body);
    const priceETB = PRICE_ETB[plan];

    const result = await paymentProvider.initiateCheckout(request.userId, priceETB);

    if (result.activateImmediately) {
      const now = new Date();
      await prisma.subscription.upsert({
        where: { userId: request.userId },
        create: {
          userId: request.userId,
          plan,
          priceETB,
          status: 'active',
          provider: paymentProvider.name,
          providerRef: result.providerRef,
          startedAt: now,
          expiresAt: addDays(now, DURATION_DAYS[plan]),
        },
        update: {
          plan,
          priceETB,
          status: 'active',
          provider: paymentProvider.name,
          providerRef: result.providerRef,
          startedAt: now,
          expiresAt: addDays(now, DURATION_DAYS[plan]),
        },
      });
    }

    return reply.send({ redirectUrl: result.redirectUrl, activated: result.activateImmediately });
  });

  // Provider callback — the only place a subscription may be activated for real
  // billing (never trust the client-side checkout "success" redirect alone).
  // Not exercised yet since PAYMENT_PROVIDER=chapa isn't implemented (see
  // paymentProvider.ts); kept idempotent-by-providerRef per docs/backend-architecture.md §10
  // so wiring in a real signature check + payload shape later doesn't change this shape.
  app.post('/billing/webhook/chapa', async (request, reply) => {
    request.log.warn('Received /billing/webhook/chapa call but Chapa integration is not implemented yet.');
    return reply.code(501).send({ error: 'Chapa webhook handling not implemented yet.' });
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
}
