import 'reflect-metadata';
import path from 'path';

import { Config } from 'src/common/config';
import { DataSource, DataSourceOptions } from 'typeorm';

// Returns a fresh options object on each call so that Config (which reads process.env)
// is evaluated lazily — critical for E2E tests that set env vars before app.init().
export function dataSourceOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    host: Config.DB_HOST,
    port: Config.DB_PORT,
    username: Config.DB_USER,
    password: Config.DB_PASSWORD,
    database: Config.DB_NAME,
    synchronize: false,
    logging: Config.isDevelopment,
    entities: [path.join(__dirname, '..', '..', '**', '*.entity.{ts,js}')],
    migrations: [
      path.join(__dirname, '..', '..', '..', 'migrations', 'schema', '*.{ts,js}'),
      path.join(__dirname, '..', '..', '..', 'migrations', 'data', '*.{ts,js}'),
    ],
    migrationsTableName: 'typeorm_migrations',
  };
}

// Used only by the TypeORM CLI (migration:generate, migration:run, etc.)
// The app connects via TypeOrmModule.forRootAsync in app.module.ts
export const AppDataSource = new DataSource(dataSourceOptions());
