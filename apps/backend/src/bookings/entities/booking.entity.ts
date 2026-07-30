import { Check, Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { WithCreatedAt } from '../../common/db/created-at.mixin';
import { enumToCheckList } from '../../common/db/util';
import { Ticket } from '../../events/entities/ticket.entity';
import { User } from '../../users/entities/user.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

const VALID_PAYMENT_STATUSES = enumToCheckList(PaymentStatus);

@Entity('booking')
@Unique('booking_ticket_id_uq', ['ticketId'])
export class Booking extends WithCreatedAt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'booking_user_id_fk' })
  user: User;

  @Column({ type: 'uuid', name: 'ticket_id' })
  ticketId: string;

  @OneToOne(() => Ticket, { nullable: false })
  @JoinColumn({ name: 'ticket_id', foreignKeyConstraintName: 'booking_ticket_id_fk' })
  ticket: Ticket;

  // working with Enums can be very difficult a much more lightweight check on the string
  // gives us the correctness without the complexity of dealing with enums
  @Check('booking_payment_status_chk', `payment_status IN (${VALID_PAYMENT_STATUSES})`)
  @Column({ type: 'varchar', length: 20, name: 'payment_status' })
  paymentStatus: PaymentStatus;
}
