import { BASE_URL } from "@/shared";

export const getHealth = async (): Promise<string> => {
  const response = await fetch(`${BASE_URL}/health`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.text();
};
