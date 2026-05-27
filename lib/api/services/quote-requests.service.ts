import { ApiError, apiRequest } from "@/lib/api/client";
import { authenticatedApiRequest } from "@/lib/auth/authenticated-request";
import { getStoredAuthTokens } from "@/lib/auth/storage";
import type {
  BackofficeQuoteRequestFilters,
  CreateQuoteRequestPayload,
  CreateQuoteRequestResponse,
  QuoteRequest,
  QuoteRequestClaimPayload,
  QuoteRequestFilters,
  QuoteRequestStatusPayload,
} from "@/lib/quote-request/types";

export class QuoteRequestApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "QuoteRequestApiError";
    this.status = status;
  }
}

function parseQuoteRequestError(error: unknown, fallbackMessage: string) {
  if (!(error instanceof ApiError)) {
    return {
      message: error instanceof Error ? error.message : fallbackMessage,
      status: 500,
    };
  }

  if (!error.details) {
    return {
      message: error.message || fallbackMessage,
      status: error.status,
    };
  }

  try {
    const parsed = JSON.parse(error.details) as { message?: unknown };
    if (Array.isArray(parsed.message) && parsed.message.length > 0) {
      return {
        message: parsed.message.join(". "),
        status: error.status,
      };
    }
    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return {
        message: parsed.message,
        status: error.status,
      };
    }
  } catch {
    return {
      message: error.details,
      status: error.status,
    };
  }

  return {
    message: fallbackMessage,
    status: error.status,
  };
}

function throwQuoteRequestError(error: unknown, fallbackMessage: string): never {
  const parsedError = parseQuoteRequestError(error, fallbackMessage);
  throw new QuoteRequestApiError(parsedError.message, parsedError.status);
}

function getOptionalAuthHeaders() {
  const accessToken = getStoredAuthTokens()?.accessToken;

  if (!accessToken) {
    return undefined;
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function createQuoteRequest(payload: CreateQuoteRequestPayload) {
  try {
    return await apiRequest<CreateQuoteRequestResponse>("/quote-requests", {
      body: payload,
      headers: getOptionalAuthHeaders(),
      method: "POST",
    });
  } catch (error) {
    throwQuoteRequestError(error, "Vui lòng kiểm tra lại thông tin yêu cầu báo giá.");
  }
}

export async function listMyQuoteRequests(filters: QuoteRequestFilters = {}) {
  try {
    return await authenticatedApiRequest<QuoteRequest[]>("/quote-requests", {
      method: "GET",
      query: filters,
    });
  } catch (error) {
    throwQuoteRequestError(error, "Không thể tải danh sách yêu cầu báo giá.");
  }
}

export async function getMyQuoteRequest(requestId: string) {
  try {
    return await authenticatedApiRequest<QuoteRequest>(`/quote-requests/${requestId}`, {
      method: "GET",
    });
  } catch (error) {
    throwQuoteRequestError(error, "Không thể tải chi tiết yêu cầu báo giá.");
  }
}

export async function listBackofficeQuoteRequests(filters: BackofficeQuoteRequestFilters = {}) {
  try {
    return await authenticatedApiRequest<QuoteRequest[]>("/backoffice/quote-requests", {
      method: "GET",
      query: filters,
    });
  } catch (error) {
    throwQuoteRequestError(error, "Không thể tải danh sách yêu cầu báo giá.");
  }
}

export async function getBackofficeQuoteRequest(requestId: string) {
  try {
    return await authenticatedApiRequest<QuoteRequest>(`/backoffice/quote-requests/${requestId}`, {
      method: "GET",
    });
  } catch (error) {
    throwQuoteRequestError(error, "Không thể tải chi tiết yêu cầu báo giá.");
  }
}

export async function claimBackofficeQuoteRequest(requestId: string, payload: QuoteRequestClaimPayload) {
  try {
    return await authenticatedApiRequest<QuoteRequest>(`/backoffice/quote-requests/${requestId}/claim`, {
      body: payload,
      method: "PATCH",
    });
  } catch (error) {
    throwQuoteRequestError(error, "Không thể nhận xử lý yêu cầu báo giá.");
  }
}

export async function updateBackofficeQuoteRequestStatus(requestId: string, payload: QuoteRequestStatusPayload) {
  try {
    return await authenticatedApiRequest<QuoteRequest>(`/backoffice/quote-requests/${requestId}/status`, {
      body: payload,
      method: "PATCH",
    });
  } catch (error) {
    throwQuoteRequestError(error, "Không thể cập nhật trạng thái yêu cầu báo giá.");
  }
}
