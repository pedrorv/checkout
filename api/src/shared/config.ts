import { z } from "zod";

const envVarsSchema = z
  .object({
    NODE_ENV: z
      .enum(["production", "development", "test"])
      .default("development"),
    API_PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string(),
    WEB_ALLOWED_ORIGINS: z.string().optional(),
    ORDER_IDLE_MINUTES: z.coerce.number().default(15),
    SWEEP_INTERVAL_MINUTES: z.coerce.number().default(3),
  })
  .passthrough();

const parsed = envVarsSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Config validation error: ${parsed.error.issues[0].message}`);
}

const envVars = parsed.data;

export const config = {
  env: envVars.NODE_ENV,
  docsEnabled: envVars.NODE_ENV === "development",
  port: envVars.API_PORT,
  databaseUrl: envVars.DATABASE_URL,
  orderIdleMs: envVars.ORDER_IDLE_MINUTES * 60_000,
  sweepIntervalMs: envVars.SWEEP_INTERVAL_MINUTES * 60_000,
  webAllowedOrigins:
    envVars.WEB_ALLOWED_ORIGINS?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [],
};
