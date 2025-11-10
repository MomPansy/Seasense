import { z } from "zod";

export const appEnvVariablesSchema = z.object({
  DB_URL: z.string(),
  ANTHROPIC_API_KEY: z.string(),
  MDH_API_KEY: z.string(),
});

export type AppEnvVariables = z.infer<typeof appEnvVariablesSchema>;
