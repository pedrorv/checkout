export type AtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Omit<T, K>>;
}[keyof T];

export type PaginatedDTO<T> = {
  data: T[];
  nextCursor: string | null;
  limit: number;
  total: number;
};
