import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { WithCreatedAt } from '../../common/db/created-at.mixin';

// artists or sports team playing team
// i.e Beyonce or New York Knicks
@Entity('event_host')
export class EventHost extends WithCreatedAt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  description: string;
}
