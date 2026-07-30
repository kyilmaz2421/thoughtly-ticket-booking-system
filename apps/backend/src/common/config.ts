import 'dotenv/config';

export class Config {
  static get PORT(): number {
    return Number(process.env.PORT) || 4000;
  }

  static get DB_HOST(): string {
    return process.env.DB_HOST || 'localhost';
  }
  static get DB_PORT(): number {
    return Number(process.env.DB_PORT) || 5432;
  }
  static get DB_USER(): string {
    return process.env.DB_USER || 'postgres';
  }
  static get DB_PASSWORD(): string {
    return process.env.DB_PASSWORD || 'postgres';
  }
  static get DB_NAME(): string {
    return process.env.DB_NAME || 'ticket_booking';
  }
  static get CLIENT_URL(): string {
    return process.env.CLIENT_URL || 'http://localhost:3000';
  }

  static get REDIS_URL(): string {
    return process.env.REDIS_URL || 'redis://localhost:6379';
  }

  static get NODE_ENV(): string {
    return process.env.NODE_ENV || 'development';
  }
  static get isDevelopment(): boolean {
    return Config.NODE_ENV === 'development';
  }
}
