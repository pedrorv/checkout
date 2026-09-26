type ResponseFactory = () => Promise<Response> | Response;

type FetchRequest = {
  path: string;
  headers: Record<string, string>;
};

type FetchMock = {
  install: () => void;
  restore: () => void;
  respondWith: (response: ResponseFactory) => void;
  respondWithByPath: (responses: Record<string, ResponseFactory>) => void;
  requests: FetchRequest[];
};

export const fetchMock: FetchMock = (() => {
  const originalFetch = globalThis.fetch;
  const requests: FetchRequest[] = [];
  let nextResponse: ResponseFactory;
  let responsesByPath: Record<string, ResponseFactory> | null = null;

  const toPathname = (input: string | URL | Request) => {
    const raw =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    return new URL(raw).pathname;
  };

  const toHeaders = (input: string | URL | Request, init?: RequestInit) =>
    Object.fromEntries(
      new Headers(
        input instanceof Request ? input.headers : init?.headers,
      ).entries(),
    );

  return {
    requests,

    install: () => {
      globalThis.fetch = (async (
        input: string | URL | Request,
        init?: RequestInit,
      ) => {
        requests.push({
          path: toPathname(input),
          headers: toHeaders(input, init),
        });

        const match = responsesByPath?.[toPathname(input)];

        if (match) {
          return match();
        }

        return nextResponse();
      }) as typeof fetch;
    },

    restore: () => {
      globalThis.fetch = originalFetch;
      responsesByPath = null;
      requests.length = 0;
      nextResponse = () =>
        Promise.reject(new Error("fetchMock: no response configured"));
    },

    respondWith: (response) => {
      nextResponse = response;
    },

    respondWithByPath: (responses) => {
      responsesByPath = responses;
    },
  };
})();
