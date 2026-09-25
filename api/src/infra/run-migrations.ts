import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export async function runMigrations(): Promise<void> {
  console.log("Running database migrations...");

  try {
    const { stdout, stderr } = await execAsync("npm run migrate:deploy");

    if (stdout) {
      console.log(stdout);
    }

    if (stderr) {
      console.error(stderr);
    }

    console.log("Database migrations completed successfully");
  } catch (error) {
    console.error("Failed to run database migrations:", error);
    throw error;
  }
}
