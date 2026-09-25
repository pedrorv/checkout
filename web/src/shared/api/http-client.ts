import { BASE_URL } from "../config";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(params: { status: number; message: string; code: string }) {
    super(params.message);
    this.name = "ApiError";
    this.status = params.status;
    this.code = params.code;
  }
}

/**
 * Fallback codes derived from the HTTP status, used only when the server
 * did not send a machine-readable `code` in the error body.
 */
const fallbackCodeByStatus: Record<number, string> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  402: "PAYMENT_REQUIRED",
  404: "NOT_FOUND",
  409: "CONFLICT",
  500: "INTERNAL_ERROR",
};

const toApiError = async (response: Response): Promise<ApiError> => {
  const fallback = `Request failed: ${response.status}`;
  const fallbackCode = fallbackCodeByStatus[response.status] ?? "unknown";

  try {
    const body = (await response.json()) as { code?: string; message?: string };

    return new ApiError({
      status: response.status,
      message: body.message ?? fallback,
      code: body.code ?? fallbackCode,
    });
  } catch {
    return new ApiError({
      status: response.status,
      message: fallback,
      code: fallbackCode,
    });
  }
};

export type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export const apiRequest = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const url = `${BASE_URL}${path}`;

  let response: Response;

  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        ...options.headers,
        ...(options.body !== undefined ? jsonHeaders : undefined),
      },
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch {
    throw toNetworkError();
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

const jsonHeaders = {
  "content-type": "application/json",
};

const toNetworkError = (): ApiError =>
  new ApiError({
    status: 0,
    message: "Network error",
    code: "NETWORK_ERROR",
  });
