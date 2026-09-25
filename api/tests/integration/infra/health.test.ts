import httpStatus from "http-status";
import request from "supertest";

import { app } from "../../../src/infra";

describe("GET /health", () => {
  it("should return OK", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(httpStatus.OK);
    expect(response.text).toBe("OK");
  });
});
