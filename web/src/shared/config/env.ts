type AppEnv = {
  VITE_API_URL?: string;
};

export const env = import.meta.env as AppEnv;

export const BASE_URL = env.VITE_API_URL ?? "http://localhost:3000";
