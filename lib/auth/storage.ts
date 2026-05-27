import type { AuthTokens } from "@/lib/auth/types";

export const AUTH_STORAGE_KEY = "shopahso.auth.tokens";
export const AUTH_STORAGE_EVENT = "shopahso.auth.changed";

function emitAuthStorageEvent(tokens: AuthTokens | null) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<AuthTokens | null>(AUTH_STORAGE_EVENT, {
      detail: tokens,
    }),
  );
}

export function getStoredAuthTokens(): AuthTokens | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<AuthTokens>;

    if (
      typeof parsedValue.accessToken !== "string" ||
      typeof parsedValue.refreshToken !== "string"
    ) {
      return null;
    }

    return {
      accessToken: parsedValue.accessToken,
      refreshToken: parsedValue.refreshToken,
    };
  } catch {
    return null;
  }
}

export function setStoredAuthTokens(tokens: AuthTokens) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
  emitAuthStorageEvent(tokens);
}

export function clearStoredAuthTokens() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  emitAuthStorageEvent(null);
}
