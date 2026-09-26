import { schemaRef } from "../refs";

export const baseSchemas = {
  EmptyObject: {
    type: "object",
    additionalProperties: false,
  },
  MessageResponse: {
    type: "object",
    required: ["code", "message"],
    properties: {
      code: { type: "string", description: "Machine-readable error code" },
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
    },
  },
  ValidationError: {
    type: "object",
    required: ["code", "message", "error"],
    properties: {
      code: {
        type: "string",
        example: "VALIDATION_ERROR",
      },
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
