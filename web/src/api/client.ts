import { env } from "../env";

const BASE_URL = env.VITE_API_URL ?? "http://localhost:3000";

export const getHealth = async (): Promise<string> => {
  const response = await fetch(`${BASE_URL}/health`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.text();
};
