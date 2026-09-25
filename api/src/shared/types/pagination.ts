export type PaginatedDTO<T> = {
  data: T[];
  nextCursor: string | null;
  limit: number;
  total: number;
};
