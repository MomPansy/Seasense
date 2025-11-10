import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as drizzleSchema from "server/drizzle/_index.ts";
import { appEnvVariables } from "server/env.ts";

const connectionString = appEnvVariables.DB_URL;
export const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema: drizzleSchema });

export type PostgresOptions = postgres.Options<
  Record<string, postgres.PostgresType>
>;

export type Tx = Parameters<
  Parameters<PostgresJsDatabase<typeof drizzleSchema>["transaction"]>[0]
>[0];
