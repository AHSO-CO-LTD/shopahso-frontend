import { getApiConfig } from "@/lib/api/config";
import type {
  ApiProbeResult,
  ApiQueryParams,
  ApiRequestOptions,
  ApiResponseType,
} from "@/lib/api/types";

export class ApiError extends Error {
  status: number;
  url: string;
  details: string;

  constructor(message: string, status: number, url: string, details = "") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.url = url;
    this.details = details;
  }
}

function buildUrl(path: string, query?: ApiQueryParams) {
  const { baseUrl } = getApiConfig();
  const url = new URL(path, baseUrl);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url;
}

function normalizeBody(body: ApiRequestOptions["body"]) {
  if (!body) {
    return undefined;
  }

  if (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ArrayBuffer
  ) {
    return body;
  }

  return JSON.stringify(body);
}

function resolveHeaders(
  headers: HeadersInit | undefined,
  body: ApiRequestOptions["body"],
) {
  const resolvedHeaders = new Headers(headers);

  if (body && !(body instanceof FormData) && !resolvedHeaders.has("Content-Type")) {
    resolvedHeaders.set("Content-Type", "application/json");
  }

  return resolvedHeaders;
}

async function parseResponse<T>(response: Response, responseType: ApiResponseType) {
  if (responseType === "none") {
    return undefined as T;
  }

  if (responseType === "text") {
    return (await response.text()) as T;
  }

  if (responseType === "blob") {
    return (await response.blob()) as T;
  }

  const rawText = await response.text();

  if (!rawText) {
    return undefined as T;
  }

  return JSON.parse(rawText) as T;
}

async function getErrorDetails(response: Response) {
  const details = await response.text();
  const trimmedDetails = details.trim();
  const normalizedDetails = trimmedDetails.toLowerCase();
  const fallbackMessage = `Không thể tải dữ liệu từ API (HTTP ${response.status}).`;
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  if (!trimmedDetails) {
    return { details: "", message: fallbackMessage };
  }

  if (
    contentType.includes("text/html") ||
    normalizedDetails.startsWith("<!doctype html") ||
    normalizedDetails.startsWith("<html")
  ) {
    return { details: "", message: fallbackMessage };
  }

  if (contentType.includes("json")) {
    try {
      const parsed = JSON.parse(trimmedDetails) as { error?: unknown; message?: unknown };
      const parsedMessage = parsed.message ?? parsed.error;

      if (Array.isArray(parsedMessage)) {
        const message = parsedMessage.filter((item) => typeof item === "string").join(", ");
        return { details: trimmedDetails, message: message || fallbackMessage };
      }

      if (typeof parsedMessage === "string" && parsedMessage.trim()) {
        return { details: trimmedDetails, message: parsedMessage.trim() };
      }
    } catch {
      return { details: trimmedDetails, message: fallbackMessage };
    }
  }

  return { details: trimmedDetails, message: trimmedDetails };
}

async function request<T>(path: string, options: ApiRequestOptions = {}) {
  const { timeoutMs: defaultTimeoutMs } = getApiConfig();
  const {
    body,
    headers,
    query,
    responseType = "json",
    timeoutMs = defaultTimeoutMs,
    ...requestInit
  } = options;
  const url = buildUrl(path, query);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...requestInit,
      body: normalizeBody(body),
      headers: resolveHeaders(headers, body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const { details, message } = await getErrorDetails(response);
      throw new ApiError(
        message,
        response.status,
        url.toString(),
        details,
      );
    }

    return await parseResponse<T>(response, responseType);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(
        `Request timed out after ${timeoutMs}ms`,
        408,
        url.toString(),
      );
    }

    throw new ApiError(
      error instanceof Error ? error.message : "Unknown API error",
      500,
      url.toString(),
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  return request<T>(path, options);
}

export async function apiProbe(
  path: string,
  options: Omit<ApiRequestOptions, "body" | "responseType"> = {},
): Promise<ApiProbeResult> {
  const { timeoutMs: defaultTimeoutMs } = getApiConfig();
  const { headers, query, timeoutMs = defaultTimeoutMs, ...requestInit } = options;
  const url = buildUrl(path, query);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...requestInit,
      headers: resolveHeaders(headers, null),
      signal: controller.signal,
    });

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      url: url.toString(),
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(
        `Probe timed out after ${timeoutMs}ms`,
        408,
        url.toString(),
      );
    }

    throw new ApiError(
      error instanceof Error ? error.message : "Unable to reach backend",
      500,
      url.toString(),
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
