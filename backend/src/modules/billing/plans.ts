// Shared by every payment path (Chapa checkout, manual Telebirr) so the price a
// plan actually costs lives in exactly one place.
export const PRICE_ETB: Record<'monthly' | 'yearly', number> = { monthly: 25, yearly: 250 };
export const DURATION_DAYS: Record<'monthly' | 'yearly', number> = { monthly: 30, yearly: 365 };

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}
