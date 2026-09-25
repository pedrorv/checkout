import type { Prisma } from "../../prisma/generated/client";

export type TransactionClient = Prisma.TransactionClient;
export type RepositoryMethodOptions = { client?: TransactionClient };
