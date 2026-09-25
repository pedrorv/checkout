type AppEnv = {
  VITE_API_URL?: string;
};

export const env = import.meta.env as AppEnv;
