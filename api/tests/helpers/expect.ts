import httpStatus from "http-status";
import type request from "supertest";

export const expectValidationError = (params: {
  response: request.Response;
  message: string;
}) => {
  const { response, message } = params;

  expect(response.status).toBe(httpStatus.BAD_REQUEST);
  expect(response.body).toEqual(
    expect.objectContaining({
      message: "Validation error",
      error: expect.objectContaining({
        details: expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining(message),
          }),
        ]),
      }),
    }),
  );
};
