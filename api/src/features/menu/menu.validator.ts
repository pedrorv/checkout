import { z } from "zod";

import { createCursorSchema } from "../../shared";
import { menuIdCursorCodec, menuPositionCursorCodec } from "./menu.cursor";

const limitSchema = z.coerce.number().int().min(1).max(100).default(20);

const positionCursorSchema = createCursorSchema(
  menuPositionCursorCodec,
  '"cursor" must be a valid position cursor',
);

const idCursorSchema = createCursorSchema(
  menuIdCursorCodec,
  '"cursor" must be a valid id cursor',
);

const listCategories = {
  query: z.object({
    cursor: positionCursorSchema,
    limit: limitSchema,
  }),
};

const listProducts = {
  query: z
    .object({
      category: z.string().optional(),
      cursor: z.string().optional(),
      limit: limitSchema,
    })
    .transform((value, ctx) => {
      if (value.cursor === undefined) {
        return { ...value, cursor: undefined };
      }

      const cursorSchema =
        value.category !== undefined ? positionCursorSchema : idCursorSchema;

      const result = cursorSchema.safeParse(value.cursor);

      if (!result.success) {
        for (const issue of result.error.issues) {
          ctx.addIssue({ ...issue, path: ["cursor"] });
        }
        return { ...value, cursor: undefined };
      }

      return { ...value, cursor: result.data };
    }),
};

const getProduct = {
  params: z.object({
    id: z.uuid(),
  }),
};

export const menuValidator = {
  listCategories,
  listProducts,
  getProduct,
};
