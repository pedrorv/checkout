import { BASE_URL, REQUEST_TIMEOUT_MS } from "../config";

export const ApiErrorCodes = {
  NetworkError: "NETWORK_ERROR",
  TimeoutError: "TIMEOUT_ERROR",
  ValidationError: "VALIDATION_ERROR",
} as const;

export type ApiErrorCode = (typeof ApiErrorCodes)[keyof typeof ApiErrorCodes];

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

  const { signal, done, timedOut } = withTimeout(options.signal);

  try {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        ...options.headers,
        ...(options.body !== undefined ? jsonHeaders : undefined),
      },
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal,
    });

    if (!response.ok) {
      throw await toApiError(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (timedOut()) {
      throw new ApiError({
        status: 0,
        message: "The request timed out",
        code: ApiErrorCodes.TimeoutError,
      });
    }

    throw new ApiError({
      status: 0,
      message: "Network error",
      code: ApiErrorCodes.NetworkError,
    });
  } finally {
    done();
  }
};

const jsonHeaders = {
  "content-type": "application/json",
};

const withTimeout = (signal: AbortSignal | undefined) => {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const abort = () => controller.abort();

  signal?.addEventListener("abort", abort, { once: true });

  return {
    signal: controller.signal,
    timedOut: () => !signal?.aborted && controller.signal.aborted,
    done: () => {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", abort);
    },
  };
};
