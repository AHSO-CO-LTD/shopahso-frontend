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

  if (configuredBaseUrl && configuredBaseUrl !== "same-origin") {
    return configuredBaseUrl;
  }

  if (configuredBaseUrl === "same-origin" && typeof window !== "undefined") {
    return window.location.origin;
  }

  return DEFAULT_API_URL;
}

export function getApiConfig() {
  return {
    baseUrl: resolveBaseUrl(),
    timeoutMs: parseTimeout(process.env.NEXT_PUBLIC_API_TIMEOUT_MS),
  };
}
