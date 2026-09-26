import { z } from "zod";

export type CursorPrimitiveCodec<T> = {
  encode: (value: T) => unknown;
  decode: (value: unknown) => T;
};

type CursorSpec<T extends Record<string, unknown>> = {
  order: readonly (keyof T)[];
  codecs: { [K in keyof T]: CursorPrimitiveCodec<T[K]> };
};

export type CursorCodec<T extends Record<string, unknown>> = {
  encode: (value: T) => string;
  decode: (cursor: string) => T;
};

const uuidLikeRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const encodeCursorPayload = (payload: unknown[]): string =>
  Buffer.from(JSON.stringify(payload)).toString("base64");

const decodeCursorPayload = (
  cursor: string,
  expectedLength: number,
): unknown[] => {
  let decoded: unknown;

  try {
    decoded = JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
  } catch {
    throw new Error("Invalid cursor");
  }

  if (!Array.isArray(decoded) || decoded.length !== expectedLength) {
    throw new Error("Invalid cursor");
  }

  return decoded;
};

export const createCursorCodec = <T extends Record<string, unknown>>(
  spec: CursorSpec<T>,
): CursorCodec<T> => ({
  encode: (value) =>
    encodeCursorPayload(
      spec.order.map((key) => spec.codecs[key].encode(value[key])),
    ),
  decode: (cursor) => {
    const payload = decodeCursorPayload(cursor, spec.order.length);

    return spec.order.reduce((acc, key, index) => {
      acc[key] = spec.codecs[key].decode(payload[index]);
      return acc;
    }, {} as T);
  },
});

export const createCursorSchema = <T extends Record<string, unknown>>(
  codec: CursorCodec<T>,
  message: string,
) =>
  z
    .string()
    .optional()
    .transform((value, ctx) => {
      if (value === undefined) {
        return undefined;
      }

      try {
        return codec.decode(value);
      } catch {
        ctx.addIssue({ code: "custom", message });
        return z.NEVER;
      }
    });

export const uuidCodec: CursorPrimitiveCodec<string> = {
  encode: (value) => value,
  decode: (value) => {
    if (typeof value !== "string" || !uuidLikeRegex.test(value)) {
      throw new Error("Invalid cursor");
    }

    return value;
  },
};

export const intCodec: CursorPrimitiveCodec<number> = {
  encode: (value) => value,
  decode: (value) => {
    if (typeof value !== "number" || !Number.isInteger(value)) {
      throw new Error("Invalid cursor");
    }

    return value;
  },
};
