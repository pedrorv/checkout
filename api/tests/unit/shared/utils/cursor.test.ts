import { v7 as uuidv7 } from "uuid";

import {
  createCursorCodec,
  createCursorSchema,
  intCodec,
  uuidCodec,
} from "../../../../src/shared/utils/cursor";

type TestCursor = {
  position: number;
  id: string;
};

const testCursorCodec = createCursorCodec<TestCursor>({
  order: ["position", "id"],
  codecs: {
    position: intCodec,
    id: uuidCodec,
  },
});

const testCursorSchema = createCursorSchema(
  testCursorCodec,
  '"cursor" must be a valid test cursor',
);

describe("createCursorSchema", () => {
  const validCursor = testCursorCodec.encode({
    position: 3,
    id: uuidv7(),
  });

  it("passes undefined through as undefined", () => {
    const result = testCursorSchema.safeParse(undefined);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeUndefined();
    }
  });

  it("decodes a valid cursor into its object form", () => {
    const result = testCursorSchema.safeParse(validCursor);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(testCursorCodec.decode(validCursor));
    }
  });

  it("rejects a malformed cursor with the custom message", () => {
    const result = testCursorSchema.safeParse("bm90LWEtY3Vyc29y");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual([
        expect.objectContaining({
          message: '"cursor" must be a valid test cursor',
        }),
      ]);
    }
  });
});
