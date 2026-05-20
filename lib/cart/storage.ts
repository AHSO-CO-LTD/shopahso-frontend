const CART_TOKEN_KEY = "shopahso.cart.token";
export const CART_STORAGE_EVENT = "shopahso.cart.changed";

function emitCartStorageEvent(token: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<string | null>(CART_STORAGE_EVENT, {
      detail: token,
    }),
  );
}

export function getStoredCartToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(CART_TOKEN_KEY);
}

export function setStoredCartToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (window.localStorage.getItem(CART_TOKEN_KEY) === token) {
    return;
  }

  window.localStorage.setItem(CART_TOKEN_KEY, token);
  emitCartStorageEvent(token);
}

export function clearStoredCartToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(CART_TOKEN_KEY);
  emitCartStorageEvent(null);
}
