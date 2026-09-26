import type { NextFunction, Request, RequestHandler, Response } from "express";
import httpStatus from "http-status";

import {
  type RequestValidationSchema,
  type Validated,
  validateSchema,
} from "./validate";

export const withValidation =
  <S extends RequestValidationSchema>(
    schema: S,
    handler: (
      req: Request,
      res: Response,
      validated: Validated<S>,
    ) => Promise<Response> | Response,
  ): RequestHandler =>
  async (req, res, next: NextFunction) => {
    const data = Object.fromEntries(
      (["headers", "cookies", "params", "query", "body"] as const).map(
        (key) => [key, key === "body" ? (req[key] ?? {}) : req[key]],
      ),
    );

    const { value, error } = validateSchema(schema, data);

    if (error) {
      return res.status(httpStatus.BAD_REQUEST).json({
        code: "VALIDATION_ERROR",
        message: "Validation error",
        error,
      });
    }

    try {
      await handler(req, res, value);
    } catch (error) {
      next(error);
    }
  };
