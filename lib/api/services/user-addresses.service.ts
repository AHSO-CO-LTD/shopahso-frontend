import { ApiError } from "@/lib/api/client";
import { authenticatedApiRequest } from "@/lib/auth/authenticated-request";
import type {
  CreateUserAddressPayload,
  DeleteUserAddressResponse,
  UpdateUserAddressPayload,
  UserAddress,
} from "@/lib/user-address/types";

function parseUserAddressError(error: unknown, fallbackMessage: string) {
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

export async function listUserAddresses() {
  try {
    return await authenticatedApiRequest<UserAddress[]>("/user-addresses", {
      method: "GET",
    });
  } catch (error) {
    throw new Error(parseUserAddressError(error, "Không thể tải danh sách địa chỉ."));
  }
}

export async function createUserAddress(payload: CreateUserAddressPayload) {
  try {
    return await authenticatedApiRequest<UserAddress>("/user-addresses", {
      body: payload,
      method: "POST",
    });
  } catch (error) {
    throw new Error(parseUserAddressError(error, "Không thể tạo địa chỉ."));
  }
}

export async function updateUserAddress(id: string, payload: UpdateUserAddressPayload) {
  try {
    return await authenticatedApiRequest<UserAddress>(`/user-addresses/${id}`, {
      body: payload,
      method: "PATCH",
    });
  } catch (error) {
    throw new Error(parseUserAddressError(error, "Không thể cập nhật địa chỉ."));
  }
}

export async function setDefaultUserAddress(id: string) {
  try {
    return await authenticatedApiRequest<UserAddress>(`/user-addresses/${id}/default`, {
      body: {},
      method: "PATCH",
    });
  } catch (error) {
    throw new Error(parseUserAddressError(error, "Không thể đặt địa chỉ mặc định."));
  }
}

export async function deleteUserAddress(id: string) {
  try {
    return await authenticatedApiRequest<DeleteUserAddressResponse>(`/user-addresses/${id}`, {
      method: "DELETE",
    });
  } catch (error) {
    throw new Error(parseUserAddressError(error, "Không thể xóa địa chỉ."));
  }
}
