import { ApiError } from "@/lib/api/client";
import { authenticatedApiRequest } from "@/lib/auth/authenticated-request";
import type {
  PaymentSetting,
  PaymentSettingPayload,
  TestVietQrPayload,
  VietQrPaymentPreview,
} from "@/lib/payment/types";

function parseBackofficeError(error: unknown, fallbackMessage: string) {
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

export async function listBackofficePaymentSettings() {
  try {
    return await authenticatedApiRequest<PaymentSetting[]>("/backoffice/payment-settings", {
      method: "GET",
    });
  } catch (error) {
    throw new Error(parseBackofficeError(error, "Không thể tải cấu hình thanh toán."));
  }
}

export async function createBackofficePaymentSetting(payload: PaymentSettingPayload) {
  try {
    return await authenticatedApiRequest<PaymentSetting>("/backoffice/payment-settings", {
      body: payload,
      method: "POST",
    });
  } catch (error) {
    throw new Error(parseBackofficeError(error, "Không thể tạo cấu hình thanh toán."));
  }
}

export async function updateBackofficePaymentSetting(id: string, payload: PaymentSettingPayload) {
  try {
    return await authenticatedApiRequest<PaymentSetting>(`/backoffice/payment-settings/${id}`, {
      body: payload,
      method: "PATCH",
    });
  } catch (error) {
    throw new Error(parseBackofficeError(error, "Không thể cập nhật cấu hình thanh toán."));
  }
}

export async function deleteBackofficePaymentSetting(id: string) {
  try {
    return await authenticatedApiRequest<PaymentSetting>(`/backoffice/payment-settings/${id}`, {
      method: "DELETE",
    });
  } catch (error) {
    throw new Error(parseBackofficeError(error, "Không thể xóa cấu hình thanh toán."));
  }
}

export async function testBackofficeVietQrPayment(payload: TestVietQrPayload) {
  try {
    return await authenticatedApiRequest<VietQrPaymentPreview>("/backoffice/payment-settings/test-vietqr", {
      body: payload,
      method: "POST",
    });
  } catch (error) {
    throw new Error(parseBackofficeError(error, "Không thể tạo QR thử."));
  }
}
