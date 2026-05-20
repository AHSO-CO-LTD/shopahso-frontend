import { ApiError, apiRequest } from "@/lib/api/client";
import { authenticatedApiRequest } from "@/lib/auth/authenticated-request";
import { getStoredAuthTokens } from "@/lib/auth/storage";
import { getStoredCartToken } from "@/lib/cart/storage";
import type {
  CheckoutOrder,
  CheckoutPreview,
  CreateCheckoutOrderPayload,
  OrderLookupPayload,
} from "@/lib/checkout/types";

function parseCheckoutError(error: unknown, fallbackMessage: string) {
  if (!(error instanceof ApiError)) {
    return error instanceof Error ? error.message : fallbackMessage;
  }

  if (!error.details) {
    return error.message || fallbackMessage;
  }

  try {
    const parsed = JSON.parse(error.details) as { message?: unknown };
    if (Array.isArray(parsed.message)) {
      return parsed.message.join(". ");
    }
    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }
  } catch {
    return error.details;
  }

  return fallbackMessage;
}

function getCheckoutHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const accessToken = getStoredAuthTokens()?.accessToken;
  const cartToken = getStoredCartToken();

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  } else if (cartToken) {
    headers["X-Cart-Token"] = cartToken;
  }

  return headers;
}

export async function previewCheckout(cartItemIds: string[]) {
  try {
    return await apiRequest<CheckoutPreview>("/checkout/preview", {
      body: { cartItemIds },
      headers: getCheckoutHeaders(),
      method: "POST",
    });
  } catch (error) {
    throw new Error(parseCheckoutError(error, "Không thể tạo bản xem trước đơn hàng."));
  }
}

export async function createCheckoutOrder(payload: CreateCheckoutOrderPayload) {
  try {
    return await apiRequest<CheckoutOrder>("/checkout/orders", {
      body: payload,
      headers: getCheckoutHeaders(),
      method: "POST",
    });
  } catch (error) {
    throw new Error(parseCheckoutError(error, "Không thể tạo đơn hàng."));
  }
}

export async function listMyOrders(status?: string) {
  try {
    return await authenticatedApiRequest<CheckoutOrder[]>("/orders", {
      method: "GET",
      query: status ? { status } : undefined,
    });
  } catch (error) {
    throw new Error(parseCheckoutError(error, "Không thể tải đơn hàng."));
  }
}

export async function getMyOrder(orderId: string) {
  try {
    return await authenticatedApiRequest<CheckoutOrder>(`/orders/${orderId}`, {
      method: "GET",
    });
  } catch (error) {
    throw new Error(parseCheckoutError(error, "Không thể tải chi tiết đơn hàng."));
  }
}

export async function confirmMyOrderPayment(orderId: string) {
  try {
    return await authenticatedApiRequest<CheckoutOrder>(`/orders/${orderId}/confirm-payment`, {
      body: {},
      method: "POST",
    });
  } catch (error) {
    throw new Error(parseCheckoutError(error, "Không thể xác nhận đã chuyển khoản."));
  }
}

export async function lookupPublicOrder(payload: OrderLookupPayload) {
  try {
    return await apiRequest<CheckoutOrder>("/orders/lookup", {
      method: "GET",
      query: {
        orderCode: payload.orderCode,
        email: payload.email,
      },
    });
  } catch (error) {
    throw new Error(parseCheckoutError(error, "Không thể tra cứu đơn hàng."));
  }
}

export async function confirmPublicOrderPayment(payload: OrderLookupPayload) {
  try {
    return await apiRequest<CheckoutOrder>("/orders/lookup/confirm-payment", {
      body: payload,
      method: "POST",
    });
  } catch (error) {
    throw new Error(parseCheckoutError(error, "Không thể xác nhận đã chuyển khoản."));
  }
}
