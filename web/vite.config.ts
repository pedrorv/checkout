import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import { defineConfig } from "vite";

export default defineConfig(() => {
  if (process.env.NODE_ENV !== "production") {
    dotenv.config({ path: path.resolve(__dirname, "../.env.dev") });
  }

  const port = process.env.WEB_PORT ? Number(process.env.WEB_PORT) : 8000;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: true,
      port,
    },
  };
});
