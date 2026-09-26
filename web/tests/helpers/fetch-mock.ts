type ResponseFactory = () => Promise<Response> | Response;

type FetchMock = {
  install: () => void;
  restore: () => void;
  respondWith: (response: ResponseFactory) => void;
  respondWithByPath: (responses: Record<string, ResponseFactory>) => void;
};

export const fetchMock: FetchMock = (() => {
  const originalFetch = globalThis.fetch;
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

  return {
    install: () => {
      globalThis.fetch = (async (input: string | URL | Request) => {
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
