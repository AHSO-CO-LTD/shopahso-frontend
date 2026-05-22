export type AuthRole = "USER" | "STAFF" | "ADMIN";

export type AuthUser = {
  id: string;
  email: string;
  role: AuthRole;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthSession = AuthTokens & {
  user: AuthUser;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  fullName: string;
  dateOfBirth: string;
  email: string;
  phoneNumber?: string;
  password: string;
};

export type UpdateProfilePayload = {
  fullName?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
};

export type LogoutResponse = {
  success: boolean;
};

export type AuthProfile = {
  id: string;
  fullName: string;
  dateOfBirth: string | null;
  email: string;
  phoneNumber: string | null;
  role: AuthRole;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};
