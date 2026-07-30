import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

const FAILURE_RATE = 0.2;
const MIN_DELAY_MS = 3000;
const MAX_DELAY_MS = 6000;

const FAILURE_MESSAGES = [
  'Your card was declined. Please check your card details or contact your bank.',
  'Payment network error. The card network did not respond — please try again.',
] as const;

export class MockStripeError extends Error {
  constructor() {
    super(FAILURE_MESSAGES[Math.floor(Math.random() * FAILURE_MESSAGES.length)]);
    this.name = 'MockStripeError';
  }
}

export interface PaymentResult {
  transactionId: string; // opaque ID returned by the payment processor
}

@Injectable()
export class PaymentService {
  async executePayment(): Promise<PaymentResult> {
    const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
    await new Promise((resolve) => setTimeout(resolve, delay));

    if (Math.random() < FAILURE_RATE) throw new MockStripeError();

    // Real Stripe returns charge.id ("ch_…"). Mock returns a recognisable prefix.
    return { transactionId: `txn_${randomUUID().replace(/-/g, '').slice(0, 24).toUpperCase()}` };
  }
}
