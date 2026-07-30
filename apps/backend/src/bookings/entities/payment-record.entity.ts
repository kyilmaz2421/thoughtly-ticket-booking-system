import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { WithCreatedAt } from '../../common/db/created-at.mixin';

import { Booking } from './booking.entity';

// A PaymentRecord row only exists when a payment succeeded.
// Failed payments leave no trace in the DB — the booking transaction rolls back entirely,
// so there is nothing to reference and nothing to record.
@Entity('payment_record')
export class PaymentRecord extends WithCreatedAt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'booking_id' })
  bookingId: string;

  @ManyToOne(() => Booking, { nullable: false })
  @JoinColumn({ name: 'booking_id', foreignKeyConstraintName: 'payment_record_booking_id_fk' })
  booking: Booking;

  @Check('payment_record_price_cents_chk', 'price_cents >= 0')
  @Column({ type: 'integer', name: 'price_cents' })
  priceCents: number;

  @Column({ type: 'varchar', length: 100, name: 'transaction_id' })
  transactionId: string;
}
