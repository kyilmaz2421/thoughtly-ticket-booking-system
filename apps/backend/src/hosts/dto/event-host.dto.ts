import { BaseDto } from '../../common/dto/base.dto';

export class EventHostDto extends BaseDto {
  id: string;
  name: string;
  description: string;
}
