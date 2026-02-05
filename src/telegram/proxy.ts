import { ProxyAgent, fetch as undiciFetch } from "undici";
import { wrapFetchWithAbortSignal } from "../infra/fetch.js";

export function makeProxyFetch(proxyUrl: string): typeof fetch {
  const agent = new ProxyAgent(proxyUrl);
  // undici fetch types are structurally incompatible with native fetch
  // (Response.headers, RequestInit.body) but functionally equivalent at runtime.
  const proxyFetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const base = init ? { ...init } : {};
    return undiciFetch(
      input as Parameters<typeof undiciFetch>[0],
      {
        ...base,
        dispatcher: agent,
      } as Parameters<typeof undiciFetch>[1],
    );
  }) as unknown as typeof fetch;
  return wrapFetchWithAbortSignal(proxyFetch);
}
