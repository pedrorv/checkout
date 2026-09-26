import httpStatus from "http-status";
import type request from "supertest";

export const expectValidationError = (params: {
  response: request.Response;
  message: string;
  path?: (string | number)[];
}) => {
  const { response, message, path } = params;

  expect(response.status).toBe(httpStatus.BAD_REQUEST);
  expect(response.body).toEqual(
    expect.objectContaining({
      code: "VALIDATION_ERROR",
      message: "Validation error",
      error: expect.objectContaining({
        details: expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining(message),
            ...(path ? { path } : {}),
          }),
        ]),
      }),
    }),
  );
};