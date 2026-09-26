import { z } from "zod";

import { validateSchema } from "../../../../src/shared/utils/validate";

describe("validateSchema", () => {
  const schema = {
    body: z.object({
      name: z.string(),
      age: z.number().int().min(0).optional(),
    }),
  };

  it("should pass a valid body through unchanged", () => {
    const data = { body: { name: "Jane", age: 30 } };

    const { error, value } = validateSchema(schema, data);

    expect(error).toBeUndefined();
    expect(value).toEqual(data);
  });

  it("should strip unknown keys from the body", () => {
    const { error, value } = validateSchema(schema, {
      body: { name: "Jane", unexpected: "field" },
    });

    expect(error).toBeUndefined();
    expect(value).toEqual({ body: { name: "Jane" } });
  });

  it("should reject an invalid body", () => {
    const { error } = validateSchema(schema, {
      body: { name: 123 },
    });

    expect(error).toBeDefined();
  });

  it("should collect all errors when issues span multiple keys", () => {
    const { error } = validateSchema(schema, {
      body: { age: -1 },
    });

    expect(error).toBeDefined();
    expect(error?.details).toHaveLength(2);
    expect(error?.details.map((detail) => detail.message)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("expected string"),
        expect.stringContaining(">=0"),
      ]),
    );
  });
});
