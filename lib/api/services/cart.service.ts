import { ApiError, apiRequest } from "@/lib/api/client";
import type { ApiRequestOptions } from "@/lib/api/types";
import { authenticatedApiRequest } from "@/lib/auth/authenticated-request";
import { getStoredAuthTokens } from "@/lib/auth/storage";
import { getStoredCartToken, setStoredCartToken } from "@/lib/cart/storage";
import type { Cart } from "@/lib/cart/types";

function parseApiErrorMessage(error: unknown, fallbackMessage: string) {
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
  } catch {
    return error.details;
  }

  return fallbackMessage;
}

function getCartHeaders(includeJson = true): HeadersInit {
  const headers: Record<string, string> = {};
  const cartToken = getStoredCartToken();

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  if (cartToken) {
    headers["X-Cart-Token"] = cartToken;
  }

  return headers;
}

function syncGuestToken(cart: Cart) {
  if (cart.guestToken) {
    setStoredCartToken(cart.guestToken);
  }
}

async function cartRequest<TCart extends Cart>(path: string, options: ApiRequestOptions) {
  const request = getStoredAuthTokens() ? authenticatedApiRequest : apiRequest;
  const cart = await request<TCart>(path, options);
  syncGuestToken(cart);
  return cart;
}

export async function getCart() {
  try {
    return await cartRequest<Cart>("/cart", {
      method: "GET",
      headers: getCartHeaders(false),
    });
  } catch (error) {
    throw new Error(parseApiErrorMessage(error, "Không thể tải giỏ hàng."));
  }
}

export async function addCartItem(variantId: string) {
  try {
    return await cartRequest<Cart>("/cart/items", {
      method: "POST",
      headers: getCartHeaders(),
      body: { variantId },
    });
  } catch (error) {
    throw new Error(parseApiErrorMessage(error, "Không thể thêm vào giỏ hàng."));
  }
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  try {
    return await cartRequest<Cart>(`/cart/items/${itemId}`, {
      method: "PATCH",
      headers: getCartHeaders(),
      body: { quantity },
    });
  } catch (error) {
    throw new Error(parseApiErrorMessage(error, "Không thể cập nhật số lượng."));
  }
}

export async function removeCartItem(itemId: string) {
  try {
    return await cartRequest<Cart>(`/cart/items/${itemId}`, {
      method: "DELETE",
      headers: getCartHeaders(false),
    });
  } catch (error) {
    throw new Error(parseApiErrorMessage(error, "Không thể xóa sản phẩm."));
  }
}

export async function clearCart() {
  try {
    return await cartRequest<Cart>("/cart", {
      method: "DELETE",
      headers: getCartHeaders(false),
    });
  } catch (error) {
    throw new Error(parseApiErrorMessage(error, "Không thể xóa giỏ hàng."));
  }
}
