import { ApiError, apiRequest } from "@/shared";
import { fetchMock } from "../../../helpers/fetch-mock";

const jsonResponse = (status: number, body: unknown) => () =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);

describe("apiRequest error handling", () => {
  beforeEach(() => {
    fetchMock.install();
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it("carries the server-sent code and message", async () => {
    fetchMock.respondWith(
      jsonResponse(409, {
        code: "OUT_OF_STOCK",
        message: "Requested quantity exceeds the available stock",
      }),
    );

    const error = await capture(() => apiRequest("/orders"));

    expect(error).toBeInstanceOf(ApiError);
    expect(error?.status).toBe(409);
    expect(error?.code).toBe("OUT_OF_STOCK");
    expect(error?.message).toBe(
      "Requested quantity exceeds the available stock",
    );
  });

  it("falls back to a status-derived code when the body has no code", async () => {
    fetchMock.respondWith(jsonResponse(404, { message: "Not found" }));

    const error = await capture(() => apiRequest("/menu/products/:id"));

    expect(error?.code).toBe("NOT_FOUND");
    expect(error?.message).toBe("Not found");
  });

  it("falls back when the body is not JSON", async () => {
    fetchMock.respondWith(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("not json")),
      } as Response),
    );

    const error = await capture(() => apiRequest("/menu"));

    expect(error?.code).toBe("INTERNAL_ERROR");
    expect(error?.message).toBe("Request failed: 500");
  });

  it("maps network failures to NETWORK_ERROR", async () => {
    fetchMock.respondWith(() => Promise.reject(new TypeError("fetch failed")));

    const error = await capture(() => apiRequest("/menu"));

    expect(error?.code).toBe("NETWORK_ERROR");
    expect(error?.status).toBe(0);
  });

  it("maps a request exceeding the timeout to TIMEOUT_ERROR", async () => {
    vi.useFakeTimers();
    fetchMock.respondWith(
      (_input, init) =>
        new Promise<Response>((_, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );

    try {
      const promise = capture(() => apiRequest("/menu"));

      await vi.advanceTimersByTimeAsync(10_000);
      const error = await promise;

      expect(error?.code).toBe("TIMEOUT_ERROR");
      expect(error?.status).toBe(0);
      expect(error?.message).toBe("The request timed out");
    } finally {
      vi.useRealTimers();
    }
  });

  it("maps a caller abort to NETWORK_ERROR, not TIMEOUT_ERROR", async () => {
    fetchMock.respondWith(
      (_input, init) =>
        new Promise<Response>((_, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );

    const controller = new AbortController();
    const promise = capture(() =>
      apiRequest("/menu", { signal: controller.signal }),
    );

    controller.abort();
    const error = await promise;

    expect(error?.code).toBe("NETWORK_ERROR");
  });

  it("returns the parsed body on success", async () => {
    fetchMock.respondWith(jsonResponse(200, { data: [] }));

    await expect(
      apiRequest<{ data: unknown[] }>("/menu/categories"),
    ).resolves.toEqual({ data: [] });
  });
});

const capture = async (fn: () => Promise<unknown>) => {
  try {
    await fn();
    return null;
  } catch (error) {
    return error as ApiError;
  }
};
