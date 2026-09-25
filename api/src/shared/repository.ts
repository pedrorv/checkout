import type { Prisma } from "../../prisma/generated/client";

export type TransactionClient = Prisma.TransactionClient;
export type RepositoryMethodOptions = { client?: TransactionClient };

export type ListResult<T> = {
  data: T[];
  hasMore: boolean;
  total: number;
};
