import { ApiError, apiRequest } from "@/lib/api/client";
import type { ApiRequestOptions } from "@/lib/api/types";
import { refreshAuthSession } from "@/lib/api/services/auth.service";
import { clearStoredAuthTokens, getStoredAuthTokens, setStoredAuthTokens } from "@/lib/auth/storage";

let refreshTokensPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

function withAccessToken(headers: HeadersInit | undefined, accessToken: string) {
  const nextHeaders = new Headers(headers);
  nextHeaders.set("Authorization", `Bearer ${accessToken}`);
  return nextHeaders;
}

function expireAuthSession(path: string): never {
  clearStoredAuthTokens();
  throw new ApiError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", 401, path);
}

async function refreshTokensOnce() {
  if (!refreshTokensPromise) {
    const currentTokens = getStoredAuthTokens();

    if (!currentTokens) {
      throw new ApiError("Phiên đăng nhập không hợp lệ", 401, "/auth/refresh");
    }

    refreshTokensPromise = refreshAuthSession(currentTokens)
      .then((session) => {
        const refreshedTokens = {
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        };

        setStoredAuthTokens(refreshedTokens);
        return refreshedTokens;
      })
      .finally(() => {
        refreshTokensPromise = null;
      });
  }

  return refreshTokensPromise;
}

export async function authenticatedApiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  const storedTokens = getStoredAuthTokens();

  if (!storedTokens) {
    throw new ApiError("Phiên đăng nhập không hợp lệ", 401, path);
  }

  try {
    return await apiRequest<T>(path, {
      ...options,
      headers: withAccessToken(options.headers, storedTokens.accessToken),
    });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }

    try {
      const refreshedTokens = await refreshTokensOnce();

      return await apiRequest<T>(path, {
        ...options,
        headers: withAccessToken(options.headers, refreshedTokens.accessToken),
      });
    } catch (refreshError) {
      if (refreshError instanceof ApiError && refreshError.status === 401) {
        expireAuthSession(path);
      }

      throw refreshError;
    }
  }
}
