import { apiRequest } from "@/lib/api/client";
import type {
  AuthProfile,
  AuthSession,
  AuthTokens,
  LoginPayload,
  LogoutResponse,
  RegisterPayload,
  UpdateProfilePayload,
} from "@/lib/auth/types";

function getAuthHeaders(accessToken?: string) {
  if (!accessToken) {
    return undefined;
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export function login(payload: LoginPayload) {
  return apiRequest<AuthSession>("/auth/login", {
    body: payload,
    method: "POST",
  });
}

export function register(payload: RegisterPayload) {
  return apiRequest<AuthSession>("/auth/register", {
    body: payload,
    method: "POST",
  });
}

export function refreshAuthSession(tokens: AuthTokens) {
  return apiRequest<AuthSession>("/auth/refresh", {
    body: {
      refreshToken: tokens.refreshToken,
    },
    method: "POST",
  });
}

export function getMyProfile(accessToken: string) {
  return apiRequest<AuthProfile>("/auth/me", {
    headers: getAuthHeaders(accessToken),
    method: "GET",
  });
}

export function updateMyProfile(accessToken: string, payload: UpdateProfilePayload) {
  return apiRequest<AuthProfile>("/auth/me", {
    body: payload,
    headers: getAuthHeaders(accessToken),
    method: "PATCH",
  });
}

export function logout(accessToken: string) {
  return apiRequest<LogoutResponse>("/auth/logout", {
    body: {},
    headers: getAuthHeaders(accessToken),
    method: "POST",
  });
}
