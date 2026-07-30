import { randomUUID } from 'crypto';

import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaymentRecord } from './entities/payment-record.entity';

const FAILURE_RATE = 0.3;
const MIN_DELAY_MS = 1000;
const MAX_DELAY_MS = 3000;

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

export interface PaymentDetails {
  cardNumber: string;
  expiry: string;
  cvv: string;
  postalCode: string;
}

@Injectable()
export class PaymentService {
  constructor(@InjectRepository(PaymentRecord) private readonly paymentRecordRepository: Repository<PaymentRecord>) {}

  // All payment data is passed to the processor end-to-end but we intentionally
  // do NOT persist raw card details (cardNumber, cvv, expiry, postalCode) — PCI-DSS compliance.
  // Only the processor-returned transactionId is stored.
  private async stripePaymentRequest(
    userId: string,
    bookingsAndPriceMap: { id: string; priceCents: number }[],
    cardNumber: string,
    expiry: string,
    cvv: string,
    postalCode: string,
  ): Promise<PaymentResult> {
    // Real Stripe call would use all params above; mock ignores card data but the
    // signature proves data flows end-to-end without being stored anywhere.
    void userId;
    void bookingsAndPriceMap;
    void cardNumber;
    void expiry;
    void cvv;
    void postalCode;

    const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
    await new Promise((resolve) => setTimeout(resolve, delay));

    if (Math.random() < FAILURE_RATE) throw new BadGatewayException(new MockStripeError().message);

    // Real Stripe returns charge.id ("ch_…"). Mock returns a recognisable prefix.
    return { transactionId: `txn_${randomUUID().replace(/-/g, '').slice(0, 24).toUpperCase()}` };
  }

  // bookingsAndPriceMap: { id, priceCents } per ticket — built from the inserted Booking IDs zipped with ticket prices.
  // totalPriceCents is derived here so the caller doesn't need to compute it separately.
  // On success: one PaymentRecord per booking storing that ticket's individual price.
  // On failure: stripePaymentRequest throws — no records are written, and since this runs
  // inside @Transactional(), the booking rows inserted before this call also roll back.
  async executePayment(
    bookingsAndPriceMap: { id: string; priceCents: number }[],
    userId: string,
    payment: PaymentDetails,
  ): Promise<PaymentResult> {
    const result = await this.stripePaymentRequest(
      userId,
      bookingsAndPriceMap,
      payment.cardNumber,
      payment.expiry,
      payment.cvv,
      payment.postalCode,
    );
    await this.paymentRecordRepository.save(
      bookingsAndPriceMap.map((booking) =>
        this.paymentRecordRepository.create({
          userId,
          bookingId: booking.id,
          priceCents: booking.priceCents,
          transactionId: result.transactionId,
        }),
      ),
    );
    return result;
  }
}
