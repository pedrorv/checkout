import Joi from "joi";

import type { RequestValidationSchema } from "../../shared";
import { menuIdCursorCodec, menuPositionCursorCodec } from "./menu.cursor";

const createCursorSchema = <T>(params: {
  decode: (cursor: string) => T;
  message: string;
}) =>
  Joi.string()
    .base64()
    .custom((value, helpers) => {
      try {
        return params.decode(value);
      } catch {
        return helpers.error("cursor.invalid");
      }
    })
    .messages({
      "cursor.invalid": params.message,
    })
    .optional();

const positionCursorSchema = createCursorSchema({
  decode: (cursor) => menuPositionCursorCodec.decode(cursor),
  message: '"cursor" must be a valid position cursor',
});

const idCursorSchema = createCursorSchema({
  decode: (cursor) => menuIdCursorCodec.decode(cursor),
  message: '"cursor" must be a valid id cursor',
});

const limitSchema = Joi.number().integer().min(1).max(100).default(20);

const listCategories: RequestValidationSchema = {
  query: Joi.object({
    cursor: positionCursorSchema,
    limit: limitSchema,
  }),
};

const listProducts: RequestValidationSchema = {
  query: Joi.object({
    category: Joi.string(),
    cursor: Joi.alternatives().conditional("category", {
      is: Joi.exist(),
      then: positionCursorSchema,
      otherwise: idCursorSchema,
    }),
    limit: limitSchema,
  }),
};

const getProduct: RequestValidationSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const menuValidator = {
  listCategories,
  listProducts,
  getProduct,
};
