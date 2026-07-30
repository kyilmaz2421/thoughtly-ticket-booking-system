import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Venue } from './entities/venue.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Venue])],
  exports: [TypeOrmModule],
})
export class VenuesModule {}
