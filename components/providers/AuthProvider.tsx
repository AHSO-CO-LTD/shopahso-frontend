"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useTransition,
} from "react";
import { ApiError } from "@/lib/api/client";
import {
  getMyProfile,
  login as loginRequest,
  logout as logoutRequest,
  refreshAuthSession,
  register as registerRequest,
  updateMyProfile,
} from "@/lib/api/services/auth.service";
import {
  AUTH_STORAGE_KEY,
  AUTH_STORAGE_EVENT,
  clearStoredAuthTokens,
  getStoredAuthTokens,
  setStoredAuthTokens,
} from "@/lib/auth/storage";
import type {
  AuthProfile,
  AuthSession,
  AuthTokens,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
} from "@/lib/auth/types";

type AuthContextValue = {
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (payload: LoginPayload) => Promise<AuthProfile>;
  logout: () => Promise<void>;
  profile: AuthProfile | null;
  refreshProfile: () => Promise<AuthProfile | null>;
  register: (payload: RegisterPayload) => Promise<AuthProfile>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<AuthProfile>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isUnauthorizedError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

function expireAuthSession(): never {
  clearStoredAuthTokens();
  throw new ApiError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", 401, "/auth/me");
}

async function hydrateProfileFromTokens(tokens: AuthTokens) {
  try {
    const profile = await getMyProfile(tokens.accessToken);

    return {
      profile,
      tokens,
    };
  } catch (error) {
    if (!isUnauthorizedError(error)) {
      throw error;
    }

    const refreshedSession = await refreshAuthSession(tokens);
    const refreshedTokens = {
      accessToken: refreshedSession.accessToken,
      refreshToken: refreshedSession.refreshToken,
    };
    const profile = await getMyProfile(refreshedTokens.accessToken);

    return {
      profile,
      tokens: refreshedTokens,
    };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      const storedTokens = getStoredAuthTokens();

      if (!storedTokens) {
        if (isMounted) {
          setIsInitializing(false);
        }
        return;
      }

      try {
        const hydratedState = await hydrateProfileFromTokens(storedTokens);

        if (!isMounted) {
          return;
        }

        setTokens(hydratedState.tokens);
        setStoredAuthTokens(hydratedState.tokens);
        setProfile(hydratedState.profile);
      } catch {
        if (!isMounted) {
          return;
        }

        clearStoredAuthTokens();
        setTokens(null);
        setProfile(null);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    void initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    function syncAuthState(nextTokens: AuthTokens | null) {
      setTokens(nextTokens);

      if (!nextTokens) {
        setIsInitializing(false);
        startTransition(() => {
          setProfile(null);
        });
      }
    }

    function handleAuthStorageChanged(event: Event) {
      const customEvent = event as CustomEvent<AuthTokens | null>;
      syncAuthState(customEvent.detail ?? getStoredAuthTokens());
    }

    function handleCrossTabAuthStorageChanged(event: StorageEvent) {
      if (event.key !== AUTH_STORAGE_KEY) {
        return;
      }

      syncAuthState(getStoredAuthTokens());
    }

    window.addEventListener(AUTH_STORAGE_EVENT, handleAuthStorageChanged as EventListener);
    window.addEventListener("storage", handleCrossTabAuthStorageChanged);

    return () => {
      window.removeEventListener(AUTH_STORAGE_EVENT, handleAuthStorageChanged as EventListener);
      window.removeEventListener("storage", handleCrossTabAuthStorageChanged);
    };
  }, [startTransition]);

  const syncSession = async (session: AuthSession) => {
    const nextTokens = {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    };
    const nextProfile = await getMyProfile(nextTokens.accessToken);

    setTokens(nextTokens);
    setStoredAuthTokens(nextTokens);
    startTransition(() => {
      setProfile(nextProfile);
    });

    return nextProfile;
  };

  const handleLogin = async (payload: LoginPayload) => {
    const session = await loginRequest(payload);
    return syncSession(session);
  };

  const handleRegister = async (payload: RegisterPayload) => {
    const session = await registerRequest(payload);
    return syncSession(session);
  };

  const handleUpdateProfile = async (payload: UpdateProfilePayload) => {
    const currentTokens = getStoredAuthTokens() ?? tokens;

    if (!currentTokens) {
      expireAuthSession();
    }

    const activeTokens = currentTokens;

    try {
      const nextProfile = await updateMyProfile(activeTokens.accessToken, payload);

      startTransition(() => {
        setProfile(nextProfile);
      });

      return nextProfile;
    } catch (error) {
      if (!isUnauthorizedError(error)) {
        throw error;
      }

      try {
        const refreshedSession = await refreshAuthSession(activeTokens);
        const refreshedTokens = {
          accessToken: refreshedSession.accessToken,
          refreshToken: refreshedSession.refreshToken,
        };
        const nextProfile = await updateMyProfile(refreshedTokens.accessToken, payload);

        setTokens(refreshedTokens);
        setStoredAuthTokens(refreshedTokens);
        startTransition(() => {
          setProfile(nextProfile);
        });

        return nextProfile;
      } catch (refreshError) {
        if (isUnauthorizedError(refreshError)) {
          setTokens(null);
          startTransition(() => {
            setProfile(null);
          });
          expireAuthSession();
        }

        throw refreshError;
      }
    }
  };

  const handleLogout = async () => {
    const currentTokens = getStoredAuthTokens() ?? tokens;

    try {
      if (currentTokens?.accessToken) {
        await logoutRequest(currentTokens.accessToken);
      }
    } finally {
      clearStoredAuthTokens();
      setTokens(null);
      startTransition(() => {
        setProfile(null);
      });
    }
  };

  const handleRefreshProfile = async () => {
    const currentTokens = getStoredAuthTokens() ?? tokens;

    if (!currentTokens) {
      setProfile(null);
      return null;
    }

    const hydratedState = await hydrateProfileFromTokens(currentTokens);

    setTokens(hydratedState.tokens);
    setStoredAuthTokens(hydratedState.tokens);
    startTransition(() => {
      setProfile(hydratedState.profile);
    });

    return hydratedState.profile;
  };

  const value: AuthContextValue = {
    isAuthenticated: Boolean(profile),
    isInitializing,
    login: handleLogin,
    logout: handleLogout,
    profile,
    refreshProfile: handleRefreshProfile,
    register: handleRegister,
    updateProfile: handleUpdateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
