type AppEnv = {
  VITE_API_URL?: string;
};

export const env = import.meta.env as AppEnv;

export const BASE_URL = env.VITE_API_URL ?? "http://localhost:3000";

/** Requests that take longer are aborted so kiosk controls never lock up. */
export const REQUEST_TIMEOUT_MS = 10_000;
