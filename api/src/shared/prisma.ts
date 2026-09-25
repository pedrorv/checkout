import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../prisma/generated/client";

import { config } from "./config";

const isDevOrTest = config.env === "development" || config.env === "test";

const adapter = new PrismaPg({
  connectionString: config.databaseUrl,
  ssl: isDevOrTest ? false : { rejectUnauthorized: false },
});

export const prisma = new PrismaClient({ adapter });
