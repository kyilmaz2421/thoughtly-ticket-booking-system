import "reflect-metadata";
import path from "path";
import { DataSource, DataSourceOptions } from "typeorm";
import { Config } from "./config";

export const dataSourceOptions: DataSourceOptions = {
  type: "postgres",
  host: Config.DB_HOST,
  port: Config.DB_PORT,
  username: Config.DB_USER,
  password: Config.DB_PASSWORD,
  database: Config.DB_NAME,
  synchronize: false,
  logging: Config.isDevelopment,
  entities: [path.join(__dirname, "**", "*.entity.{ts,js}")],
  migrations: [
    path.join(__dirname, "..", "migrations", "schema", "*.{ts,js}"),
    path.join(__dirname, "..", "migrations", "data", "*.{ts,js}"),
  ],
  migrationsTableName: "typeorm_migrations",
};

// Used only by the TypeORM CLI (migration:generate, migration:run, etc.)
// The app connects via TypeOrmModule.forRoot(dataSourceOptions) in app.module.ts
export const AppDataSource = new DataSource(dataSourceOptions);
