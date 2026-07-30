import { Injectable } from '@nestjs/common';
import { Config } from './config';

@Injectable()
export class AppService {
  healthCheck(): string {
    return `Backend is running at http://localhost:${Config.PORT}`;
  }
}
