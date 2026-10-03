import crypto from 'node:crypto';
import { env } from '../../env';

export type CheckoutResult = {
  redirectUrl: string | null;
  providerRef: string;
  activateImmediately: boolean;
};

export type CheckoutDetails = {
  plan: 'monthly' | 'yearly';
  // Chapa's initialize endpoint requires an email; the app has none (Telegram-only
  // auth, see docs/backend-architecture.md §5) so routes.ts synthesizes a
  // placeholder when the user hasn't supplied a real one. Fine for processing the
  // charge — only matters if Chapa emails a receipt to it.
  email: string;
  firstName: string;
};

export interface PaymentProvider {
  name: 'mock' | 'chapa';
  initiateCheckout(userId: string, priceETB: number, details: CheckoutDetails): Promise<CheckoutResult>;
}

// Activates the subscription immediately with a synthetic reference — no real money
// moves. Use this for local dev until a live Chapa merchant key exists.
class MockPaymentProvider implements PaymentProvider {
  name = 'mock' as const;
  async initiateCheckout(): Promise<CheckoutResult> {
    return { redirectUrl: null, providerRef: `mock_${crypto.randomUUID()}`, activateImmediately: true };
  }
}

const CHAPA_BASE_URL = 'https://api.chapa.co/v1';

class ChapaPaymentProvider implements PaymentProvider {
  name = 'chapa' as const;

  async initiateCheckout(userId: string, priceETB: number, details: CheckoutDetails): Promise<CheckoutResult> {
    if (!env.CHAPA_SECRET_KEY) {
      throw new Error('CHAPA_SECRET_KEY is not set — Chapa checkout is not configured.');
    }
    if (!env.PUBLIC_BASE_URL) {
      throw new Error(
        'PUBLIC_BASE_URL is not set — Chapa needs a publicly reachable callback_url for its webhook. ' +
          'In local dev, run a tunnel (e.g. `ngrok http 4000`) and set this to the tunnel URL.'
      );
    }

    // Never reused across checkout attempts (even retries for the same user) —
    // it's both Chapa's own idempotency key and how the webhook finds the right
    // pending Subscription row back (see routes.ts, keyed on providerRef).
    const txRef = `compass_${crypto.randomUUID()}`;

    const res = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: String(priceETB),
        currency: 'ETB',
        email: details.email,
        first_name: details.firstName,
        last_name: 'Student',
        tx_ref: txRef,
        callback_url: `${env.PUBLIC_BASE_URL}/billing/webhook/chapa`,
        customization: {
          title: 'Compass Pro',
          description: `Compass Pro — ${details.plan} plan`,
        },
      }),
    });

    const payload = (await res.json()) as { status?: string; message?: string; data?: { checkout_url?: string } };
    if (!res.ok || payload.status !== 'success' || !payload.data?.checkout_url) {
      throw new Error(`Chapa checkout initialization failed: ${payload.message ?? res.statusText}`);
    }

    return { redirectUrl: payload.data.checkout_url, providerRef: txRef, activateImmediately: false };
  }
}

function createPaymentProvider(): PaymentProvider {
  switch (env.PAYMENT_PROVIDER) {
    case 'mock':
      return new MockPaymentProvider();
    case 'chapa':
      return new ChapaPaymentProvider();
  }
}

export const paymentProvider = createPaymentProvider();

export type ChapaVerification = {
  ok: boolean;
  amount?: number;
  currency?: string;
  status?: string;
};

// Server-to-server re-query — the webhook payload itself is never trusted for
// amount/status, only used to know *which* tx_ref to look up (Chapa's own
// guidance: "Always re-query our API to verify the transaction details").
export async function verifyChapaTransaction(txRef: string): Promise<ChapaVerification> {
  const res = await fetch(`${CHAPA_BASE_URL}/transaction/verify/${encodeURIComponent(txRef)}`, {
    headers: { Authorization: `Bearer ${env.CHAPA_SECRET_KEY}` },
  });
  const payload = (await res.json()) as {
    status?: string;
    data?: { status?: string; amount?: string | number; currency?: string };
  };
  if (!res.ok || payload.status !== 'success' || !payload.data) {
    return { ok: false };
  }
  return {
    ok: payload.data.status === 'success',
    amount: payload.data.amount !== undefined ? Number(payload.data.amount) : undefined,
    currency: payload.data.currency,
    status: payload.data.status,
  };
}

// Chapa signs webhook deliveries two ways (either is sufficient — see
// developer.chapa.co/docs/webhooks): `chapa-signature` is an HMAC-SHA256 of the
// secret key itself, `x-chapa-signature` is an HMAC-SHA256 of the raw request
// body. Both keyed on CHAPA_SECRET_KEY. Reject the request if neither matches —
// this is the only thing standing between "a real Chapa payment" and "anyone
// who finds the webhook URL can activate Pro for free."
export function verifyChapaWebhookSignature(rawBody: string, headers: Record<string, string | string[] | undefined>): boolean {
  const secret = env.CHAPA_SECRET_KEY;
  if (!secret) return false;

  const bodySig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const keySig = crypto.createHmac('sha256', secret).update(secret).digest('hex');

  const header = (name: string) => {
    const v = headers[name];
    return typeof v === 'string' ? v : undefined;
  };

  const xChapaSig = header('x-chapa-signature');
  const chapaSig = header('chapa-signature');

  const timingSafeEqual = (a?: string, b?: string) => {
    if (!a || !b || a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  };

  return timingSafeEqual(xChapaSig, bodySig) || timingSafeEqual(chapaSig, keySig);
}
