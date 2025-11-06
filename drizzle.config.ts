import { defineConfig } from "drizzle-kit";
import { appEnvVariables } from "./server/env.ts";

export default defineConfig({
  dialect: "postgresql",
  schema: "server/drizzle/*.ts",
  schemaFilter: ["public"],
  out: "server/drizzle/migrations",
  verbose: true,
  dbCredentials: {
    url: appEnvVariables.DB_URL,
  },
  breakpoints: false,
});
