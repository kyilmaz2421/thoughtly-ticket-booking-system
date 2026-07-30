import { Check, Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { WithCreatedAt } from '../../common/db/created-at.mixin';

@Entity('venue')
@Check('venue_vip_capacity_chk', 'vip_capacity >= 0')
@Check('venue_front_row_capacity_chk', 'front_row_capacity >= 0')
@Check('venue_ga_capacity_chk', 'ga_capacity >= 0')
@Unique('venue_address_uq', ['addressLine1', 'addressLine2', 'city', 'stateProvince', 'postalOrZipCode', 'countryCode'])
export class Venue extends WithCreatedAt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, name: 'address_line1', nullable: false })
  addressLine1: string;

  @Column({ type: 'varchar', length: 255, name: 'address_line2', nullable: false })
  addressLine2: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  city: string;

  @Column({ type: 'varchar', length: 100, name: 'state_province', nullable: true })
  stateProvince: string | null;

  @Column({ type: 'varchar', length: 20, name: 'postal_or_zip_code', nullable: false })
  postalOrZipCode: string;

  @Column({ type: 'char', length: 2, name: 'country_code', nullable: false })
  countryCode: string;

  @Column({ type: 'int', name: 'vip_capacity', nullable: false })
  vipCapacity: number;

  @Column({ type: 'int', name: 'front_row_capacity', nullable: false })
  frontRowCapacity: number;

  @Column({ type: 'int', name: 'ga_capacity', nullable: false })
  gaCapacity: number;
}
