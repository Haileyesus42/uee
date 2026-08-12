import crypto from 'node:crypto';
import { env } from '../../env';

export type CheckoutResult = {
  redirectUrl: string | null;
  providerRef: string;
  activateImmediately: boolean;
};

export interface PaymentProvider {
  name: 'mock' | 'chapa';
  initiateCheckout(userId: string, priceETB: number): Promise<CheckoutResult>;
}

// Activates the subscription immediately with a synthetic reference — no real money
// moves. Use this for local dev until a live Chapa merchant key exists.
class MockPaymentProvider implements PaymentProvider {
  name = 'mock' as const;
  async initiateCheckout(): Promise<CheckoutResult> {
    return { redirectUrl: null, providerRef: `mock_${crypto.randomUUID()}`, activateImmediately: true };
  }
}

// Real integration deliberately not implemented yet — there's no live Chapa merchant
// key to test against. Swapping PAYMENT_PROVIDER=chapa fails loudly here rather than
// silently behaving like the mock, until this is filled in with a real API call to
// Chapa's hosted-checkout-initialize endpoint and CHAPA_SECRET_KEY is set.
class ChapaPaymentProvider implements PaymentProvider {
  name = 'chapa' as const;
  async initiateCheckout(): Promise<CheckoutResult> {
    if (!env.CHAPA_SECRET_KEY) {
      throw new Error('CHAPA_SECRET_KEY is not set — Chapa checkout is not configured.');
    }
    throw new Error('Chapa integration is not implemented yet.');
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
