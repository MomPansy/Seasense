import { z } from 'zod'

export const appEnvVariablesSchema = z.object({
    DB_URL: z.string()
})

export type AppEnvVariables = z.infer<typeof appEnvVariablesSchema>;