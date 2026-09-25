import { prisma } from "../../src/shared/prisma";

export * from "./expect";

export const isIntegrationTest = process.env.TEST === "integration";
export const isUnitTest = process.env.TEST === "unit";

if (isIntegrationTest && !process.env.DATABASE_URL?.includes("checkout-test")) {
  throw new Error(
    "The DATABASE_URL environment variable must point to the test database (checkout-test) when running tests.",
  );
}

export const setupDB = async () => {
  await prisma.$connect();

  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== "_prisma_migrations")
    .map((name) => `"public"."${name}"`)
    .join(", ");

  if (tables.length === 0) {
    return;
  }

  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
};

export const disconnectDB = async () => {
  await prisma.$disconnect();
};
