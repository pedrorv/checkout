import { schemaRef } from "../refs";

export const baseSchemas = {
  EmptyObject: {
    type: "object",
    additionalProperties: false,
  },
  MessageResponse: {
    type: "object",
    required: ["message"],
    properties: {
      message: { type: "string" },
    },
  },
  ValidationErrorDetail: {
    type: "object",
    required: ["message"],
    properties: {
      message: { type: "string" },
      path: {
        type: "array",
        items: {
          oneOf: [{ type: "string" }, { type: "integer" }],
        },
      },
      type: { type: "string" },
      context: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
  ValidationError: {
    type: "object",
    required: ["message", "error"],
    properties: {
      message: {
        type: "string",
        example: "Validation error",
      },
      error: {
        type: "object",
        properties: {
          details: {
            type: "array",
            items: schemaRef("ValidationErrorDetail"),
          },
        },
        additionalProperties: true,
      },
    },
  },
};
