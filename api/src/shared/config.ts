import Joi from "joi";

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string()
      .valid("production", "development", "test")
      .default("development"),
    API_PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().required(),
    WEB_ALLOWED_ORIGINS: Joi.string().allow(null, ""),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: "key" } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
  env: envVars.NODE_ENV as string,
  docsEnabled: envVars.NODE_ENV === "development",
  port: envVars.API_PORT as number,
  databaseUrl: envVars.DATABASE_URL as string,
  webAllowedOrigins:
    (envVars.WEB_ALLOWED_ORIGINS as string | undefined)
      ?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [],
};
