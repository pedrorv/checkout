import Joi from "joi";

import { validateSchema } from "../../../../src/shared/utils/validate";

describe("validateSchema", () => {
  const schema = {
    body: Joi.object({
      name: Joi.string().required(),
      age: Joi.number().integer().min(0),
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

  it("should collect all errors when abortEarly is false", () => {
    const { error } = validateSchema(schema, {
      body: { age: -1 },
    });

    expect(error).toBeDefined();
    expect(error?.details).toHaveLength(2);
    expect(error?.details.map((detail) => detail.message)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('"name" is required'),
        expect.stringContaining('"age" must be greater than or equal to 0'),
      ]),
    );
  });
});
