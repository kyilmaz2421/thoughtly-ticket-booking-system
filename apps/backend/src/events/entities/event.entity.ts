import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { WithCreatedAt } from '../../common/db/created-at.mixin';
import { enumToCheckList } from '../../common/db/util';
import { EventHost } from '../../hosts/entities/event-host.entity';
import { Venue } from '../../venues/entities/venue.entity';

// NOTE: enums are not the correct way to do this
// In a production system we would probably have a lookup table and it would hold meta-data used in how we display an event
// i.e an NBA game may be represented differently then a broadway show
export enum EventType {
  CONCERT = 'concert',
  SPORTING = 'sporting',
  BROADWAY = 'broadway',
}

const VALID_EVENT_TYPES = enumToCheckList(EventType);

@Entity('event')
@Check('event_type_chk', `event_type IN (${VALID_EVENT_TYPES})`)
@Unique('event_start_datetime_end_datetime_venue_id_uq', ['startDatetime', 'endDatetime', 'venueId'])
export class Event extends WithCreatedAt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: false })
  description: string;

  @Column({ type: 'timestamptz', name: 'start_datetime', nullable: false })
  startDatetime: Date;

  @Column({ type: 'timestamptz', name: 'end_datetime', nullable: false })
  endDatetime: Date;

  @Column({ type: 'varchar', length: 50, name: 'event_type', nullable: false })
  eventType: EventType;

  @Column({ type: 'uuid', name: 'event_host_id' })
  eventHostId: string;

  @ManyToOne(() => EventHost, { nullable: false })
  @JoinColumn({ name: 'event_host_id', foreignKeyConstraintName: 'event_event_host_id_fk' })
  eventHost: EventHost;

  @Column({ type: 'uuid', name: 'venue_id' })
  venueId: string;

  @ManyToOne(() => Venue, { nullable: false })
  @JoinColumn({ name: 'venue_id', foreignKeyConstraintName: 'event_venue_id_fk' })
  venue: Venue;
}
