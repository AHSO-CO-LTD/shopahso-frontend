import { ApiError } from "@/lib/api/client";
import { authenticatedApiRequest } from "@/lib/auth/authenticated-request";
import type { CheckoutOrder } from "@/lib/checkout/types";

export type BackofficeOrderFilters = {
  fulfillmentStatus?: string;
  paymentStatus?: string;
  status?: string;
};

export type BackofficeOrderNotePayload = {
  staffNote?: string;
};

export type BackofficeOrderReasonPayload = {
  reason: string;
  staffNote?: string;
};

export type BackofficeFulfillmentPayload = {
  fulfillmentStatus: string;
  staffNote?: string;
};

function parseBackofficeOrderError(error: unknown, fallbackMessage: string) {
  if (!(error instanceof ApiError)) {
    return error instanceof Error ? error.message : fallbackMessage;
  }

  if (!error.details) {
    return error.message || fallbackMessage;
  }

  try {
    const parsed = JSON.parse(error.details) as { message?: unknown };

    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }

    if (Array.isArray(parsed.message) && parsed.message.length > 0) {
      return parsed.message.join(", ");
    }
  } catch {
    return error.details;
  }

  return fallbackMessage;
}

export async function listBackofficeOrders(filters: BackofficeOrderFilters = {}) {
  try {
    return await authenticatedApiRequest<CheckoutOrder[]>("/backoffice/orders", {
      method: "GET",
      query: filters,
    });
  } catch (error) {
    throw new Error(parseBackofficeOrderError(error, "Không thể tải danh sách đơn hàng."));
  }
}

export async function getBackofficeOrder(orderId: string) {
  try {
    return await authenticatedApiRequest<CheckoutOrder>(`/backoffice/orders/${orderId}`, {
      method: "GET",
    });
  } catch (error) {
    throw new Error(parseBackofficeOrderError(error, "Không thể tải chi tiết đơn hàng."));
  }
}

export async function confirmBackofficeOrder(orderId: string, payload: BackofficeOrderNotePayload) {
  try {
    return await authenticatedApiRequest<CheckoutOrder>(`/backoffice/orders/${orderId}/confirm`, {
      body: payload,
      method: "PATCH",
    });
  } catch (error) {
    throw new Error(parseBackofficeOrderError(error, "Không thể xác nhận đơn hàng."));
  }
}

export async function rejectBackofficeOrder(orderId: string, payload: BackofficeOrderReasonPayload) {
  try {
    return await authenticatedApiRequest<CheckoutOrder>(`/backoffice/orders/${orderId}/reject`, {
      body: payload,
      method: "PATCH",
    });
  } catch (error) {
    throw new Error(parseBackofficeOrderError(error, "Không thể từ chối đơn hàng."));
  }
}

export async function cancelBackofficeOrder(orderId: string, payload: BackofficeOrderReasonPayload) {
  try {
    return await authenticatedApiRequest<CheckoutOrder>(`/backoffice/orders/${orderId}/cancel`, {
      body: payload,
      method: "PATCH",
    });
  } catch (error) {
    throw new Error(parseBackofficeOrderError(error, "Không thể hủy đơn hàng."));
  }
}

export async function confirmBackofficeOrderPayment(orderId: string, payload: BackofficeOrderNotePayload) {
  try {
    return await authenticatedApiRequest<CheckoutOrder>(`/backoffice/orders/${orderId}/confirm-payment`, {
      body: payload,
      method: "PATCH",
    });
  } catch (error) {
    throw new Error(parseBackofficeOrderError(error, "Không thể xác nhận thanh toán."));
  }
}

export async function rejectBackofficeOrderPayment(orderId: string, payload: BackofficeOrderReasonPayload) {
  try {
    return await authenticatedApiRequest<CheckoutOrder>(`/backoffice/orders/${orderId}/reject-payment`, {
      body: payload,
      method: "PATCH",
    });
  } catch (error) {
    throw new Error(parseBackofficeOrderError(error, "Không thể từ chối thanh toán."));
  }
}

export async function updateBackofficeOrderStaffNote(orderId: string, payload: BackofficeOrderNotePayload) {
  try {
    return await authenticatedApiRequest<CheckoutOrder>(`/backoffice/orders/${orderId}/staff-note`, {
      body: payload,
      method: "PATCH",
    });
  } catch (error) {
    throw new Error(parseBackofficeOrderError(error, "Không thể cập nhật ghi chú nhân viên."));
  }
}

export async function updateBackofficeOrderFulfillment(orderId: string, payload: BackofficeFulfillmentPayload) {
  try {
    return await authenticatedApiRequest<CheckoutOrder>(`/backoffice/orders/${orderId}/fulfillment`, {
      body: payload,
      method: "PATCH",
    });
  } catch (error) {
    throw new Error(parseBackofficeOrderError(error, "Không thể cập nhật giao hàng."));
  }
}
