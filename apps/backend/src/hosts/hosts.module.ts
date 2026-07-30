import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventHost } from './entities/event-host.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EventHost])],
  exports: [TypeOrmModule],
})
export class HostsModule {}
