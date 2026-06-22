const DEFAULT_API_URL = "http://localhost:3001";
const DEFAULT_API_TIMEOUT_MS = 10_000;

function parseTimeout(value: string | undefined): number {
  if (!value) {
    return DEFAULT_API_TIMEOUT_MS;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return DEFAULT_API_TIMEOUT_MS;
  }

  return parsedValue;
}

function resolveBaseUrl() {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const serverProxyTarget = process.env.SHOPAHSO_DEV_API_PROXY_TARGET?.trim();

  if (configuredBaseUrl && configuredBaseUrl !== "same-origin") {
    return configuredBaseUrl;
  }

  if (configuredBaseUrl === "same-origin") {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    if (serverProxyTarget) {
      return serverProxyTarget;
    }
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[api/config] NEXT_PUBLIC_API_URL=same-origin on SSR without SHOPAHSO_DEV_API_PROXY_TARGET — " +
        "falling back to DEFAULT_API_URL. Set SHOPAHSO_DEV_API_PROXY_TARGET to fix SSR API calls.",
      );
    }
  }

  return DEFAULT_API_URL;
}

export function getApiConfig() {
  return {
    baseUrl: resolveBaseUrl(),
    timeoutMs: parseTimeout(process.env.NEXT_PUBLIC_API_TIMEOUT_MS),
  };
}
