import 'dotenv/config';

export class Config {
  static readonly PORT: number = Number(process.env.PORT) || 4000;

  static readonly DB_HOST: string = process.env.DB_HOST || 'localhost';
  static readonly DB_PORT: number = Number(process.env.DB_PORT) || 5432;
  static readonly DB_USER: string = process.env.DB_USER || 'postgres';
  static readonly DB_PASSWORD: string = process.env.DB_PASSWORD || 'postgres';
  static readonly DB_NAME: string = process.env.DB_NAME || 'ticket_booking';

  static readonly NODE_ENV: string = process.env.NODE_ENV || 'development';
  static get isDevelopment(): boolean {
    return Config.NODE_ENV === 'development';
  }
}
