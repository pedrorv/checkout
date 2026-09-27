import { randomInt } from "node:crypto";

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CODE_LENGTH = 4;

/**
 * A short code the customer shows at the counter. Codes only need to be
 * unique within a day, so they are stored as `YYYY-MM-DD-CODE` (UTC date)
 * under a unique index and only the trailing code is exposed.
 */
const generate = (): string =>
  Array.from(
    { length: CODE_LENGTH },
    () => ALPHABET[randomInt(ALPHABET.length)],
  ).join("");

const toKey = (params: { code: string; date: Date }): string =>
  `${params.date.toISOString().slice(0, 10)}-${params.code}`;

const fromKey = (key: string): string => key.slice(-CODE_LENGTH);

export const pickupCode = {
  generate,
  toKey,
  fromKey,
};
