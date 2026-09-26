import type { z } from "zod";

export type RequestValidationSchema = {
  headers?: z.ZodType;
  cookies?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
  body?: z.ZodType;
};

export type Validated<S extends RequestValidationSchema> = {
  [K in keyof S]: S[K] extends z.ZodType ? z.output<S[K]> : never;
};

export type ValidationIssue = {
  message: string;
  path: (string | number)[];
  type: string;
};

const issueToDetail = (
  section: string,
  issue: z.core.$ZodIssue,
): ValidationIssue => ({
  message: issue.message,
  path: [
    section,
    ...issue.path.map((segment) =>
      typeof segment === "number" ? segment : String(segment),
    ),
  ],
  type: issue.code,
});

export const validateSchema = <S extends RequestValidationSchema>(
  schema: S,
  data: unknown,
): { value: Validated<S>; error?: { details: ValidationIssue[] } } => {
  const source = (data ?? {}) as Record<string, unknown>;
  const entries = Object.entries(schema) as Array<[string, z.ZodType]>;
  const details: ValidationIssue[] = [];

  const value = Object.fromEntries(
    entries.map(([key, keySchema]) => {
      const result = keySchema.safeParse(source[key]);

      if (result.success) {
        return [key, result.data];
      }

      details.push(...result.error.issues.map((issue) => issueToDetail(key, issue)));
      return [key, undefined];
    }),
  ) as Validated<S>;

  return details.length > 0 ? { value, error: { details } } : { value };
};
