// Flips any `active` Subscription past its expiresAt to `expired`
// (docs/backend-architecture.md §11: "A daily job flips status: active → expired
// for any SUBSCRIPTION past expiresAt that didn't renew"). Meant to run on a daily
// cron (e.g. Fly/Render scheduled job) — safe to run more often, it's a no-op when
// nothing has lapsed.
//
// Note: GET /billing/subscription already computes this on read (so a user never
// *sees* a stale "active" after expiry even before this runs) — this job is for
// anything that reads Subscription.status directly instead of through that route
// (e.g. a future admin dashboard, or a bulk query gating the Unity daily cap).
//
// Usage:
//   npm run billing:expire
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.subscription.updateMany({
    where: { status: 'active', expiresAt: { lt: new Date() } },
    data: { status: 'expired' },
  });
  console.log(`Expired ${result.count} subscription(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
