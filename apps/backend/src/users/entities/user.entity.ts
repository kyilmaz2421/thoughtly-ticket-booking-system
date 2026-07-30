import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { WithCreatedAt } from '../../common/db/created-at.mixin';

@Entity('user')
@Unique('user_email_uq', ['email'])
export class User extends WithCreatedAt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;
}
