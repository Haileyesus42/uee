import { prisma } from './prisma';

// Called from every place a subscription actually activates — mock/mock-checkout
// (routes.ts), the real Chapa webhook (routes.ts), and Telebirr's shared
// activateFromSubmission (telebirr.ts, covers both auto-approve and admin
// review-approve) — so this fires exactly once per real upgrade regardless of
// which payment path produced it.
export async function notifyUpgrade(userId: string, plan: 'monthly' | 'yearly', expiresAt: Date) {
  const planLabel = plan === 'yearly' ? 'Yearly' : 'Monthly';
  const until = expiresAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  await prisma.notification.create({
    data: {
      userId,
      title: "You're Pro! 🎉",
      body: `${planLabel} plan active until ${until}.`,
    },
  });
}
