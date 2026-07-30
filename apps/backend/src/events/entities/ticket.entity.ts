import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { WithCreatedAt } from '../../common/db/created-at.mixin';
import { enumToCheckList } from '../../common/db/util';

import { Event } from './event.entity';

// NOTE: Enums are not the correct way to do this
// in a production system we would have a join table venue_section with a direct FK here
export enum TicketSection {
  VIP = 'VIP',
  FRONT_ROW = 'Front Row',
  GA = 'GA',
}

const VALID_SECTIONS = enumToCheckList(TicketSection);

@Entity('ticket')
@Check('ticket_seat_number_chk', 'seat_number >= 0')
@Check('ticket_section_chk', `section IN (${VALID_SECTIONS})`)
@Unique('ticket_event_id_section_seat_number_uq', ['eventId', 'section', 'seatNumber'])
export class Ticket extends WithCreatedAt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'event_id' })
  eventId: string;

  @ManyToOne(() => Event, { nullable: false })
  @JoinColumn({ name: 'event_id', foreignKeyConstraintName: 'ticket_event_id_fk' })
  event: Event;

  @Column({ type: 'varchar', length: 50, nullable: false })
  section: TicketSection;

  @Column({ type: 'int', name: 'seat_number', nullable: false })
  seatNumber: number;
}
