import { ApiError } from "@/lib/api/client";
import { authenticatedApiRequest } from "@/lib/auth/authenticated-request";
import type { DeleteTaxSettingPayload, TaxSetting, UpsertTaxSettingPayload } from "@/lib/tax/types";

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
  } catch {
    return error.details;
  }

  return fallbackMessage;
}

export async function listBackofficeTaxSettings() {
  try {
    return await authenticatedApiRequest<TaxSetting[]>("/backoffice/tax-settings", {
      method: "GET",
    });
  } catch (error) {
    throw new Error(parseBackofficeError(error, "Không thể tải thiết lập thuế."));
  }
}

export async function upsertBackofficeTaxSetting(payload: UpsertTaxSettingPayload) {
  try {
    return await authenticatedApiRequest<TaxSetting>("/backoffice/tax-settings", {
      body: payload,
      method: "POST",
    });
  } catch (error) {
    throw new Error(parseBackofficeError(error, "Không thể lưu thiết lập thuế."));
  }
}

export async function deleteBackofficeTaxSetting(payload: DeleteTaxSettingPayload) {
  try {
    return await authenticatedApiRequest<TaxSetting>("/backoffice/tax-settings", {
      body: payload,
      method: "DELETE",
    });
  } catch (error) {
    throw new Error(parseBackofficeError(error, "Không thể xóa thiết lập thuế."));
  }
}
