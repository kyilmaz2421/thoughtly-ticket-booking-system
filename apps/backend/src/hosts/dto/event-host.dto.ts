import { BaseDto } from '../../common/dto/base.dto';
import { EventHost } from '../entities/event-host.entity';

export class EventHostDto extends BaseDto {
  id: string;
  name: string;
  description: string;

  static from(host: EventHost): EventHostDto {
    return {
      id: host.id,
      name: host.name,
      description: host.description,
      createdAt: host.createdAt.toISOString(),
    };
  }
}
