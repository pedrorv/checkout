import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

import {
  pick,
  type RequestValidationSchema,
  validateSchema,
} from "../../shared";

export const validateRequest =
  (schema: RequestValidationSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const requestParams: Array<keyof RequestValidationSchema> = [
      "headers",
      "cookies",
      "params",
      "query",
      "body",
    ];
    const validSchema = pick(schema, requestParams);
    const data = pick(req, requestParams);
    data.body ??= {};

    const { value, error } = validateSchema(validSchema, data);

    if (error) {
      return res.status(httpStatus.BAD_REQUEST).json({
        code: "VALIDATION_ERROR",
        message: "Validation error",
        error,
      });
    }

    res.locals.validated = value;

    return next();
  };
