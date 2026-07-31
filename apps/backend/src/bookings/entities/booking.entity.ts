import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { WithCreatedAt } from '../../common/db/created-at.mixin';
import { Ticket } from '../../events/entities/ticket.entity';
import { User } from '../../users/entities/user.entity';

@Entity('booking')
@Unique('booking_ticket_id_uq', ['ticketId'])
@Index('booking_user_id_idx', ['userId'])
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
}
