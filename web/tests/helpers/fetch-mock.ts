type FetchMock = {
  install: () => void;
  restore: () => void;
  respondWith: (response: Promise<Response>) => void;
};

export const fetchMock: FetchMock = (() => {
  const originalFetch = globalThis.fetch;
  let nextResponse: Promise<Response>;

  return {
    install: () => {
      globalThis.fetch = (() => nextResponse) as typeof fetch;
    },

    restore: () => {
      globalThis.fetch = originalFetch;
    },

    respondWith: (response) => {
      nextResponse = response;
    },
  };
})();
