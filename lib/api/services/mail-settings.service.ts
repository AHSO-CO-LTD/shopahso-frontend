import { ApiError } from "@/lib/api/client";
import { authenticatedApiRequest } from "@/lib/auth/authenticated-request";
import type {
  MailSettings,
  MailSettingsPayload,
  TestMailSettingsPayload,
  TestMailSettingsResponse,
} from "@/lib/mail/types";

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

export async function getBackofficeMailSettings() {
  try {
    return await authenticatedApiRequest<MailSettings>("/backoffice/mail-settings", {
      method: "GET",
    });
  } catch (error) {
    throw new Error(parseBackofficeError(error, "Không thể tải cấu hình email."));
  }
}

export async function updateBackofficeMailSettings(payload: MailSettingsPayload) {
  try {
    return await authenticatedApiRequest<MailSettings>("/backoffice/mail-settings", {
      body: payload,
      method: "PATCH",
    });
  } catch (error) {
    throw new Error(parseBackofficeError(error, "Không thể lưu cấu hình email."));
  }
}

export async function testBackofficeMailSettings(payload: TestMailSettingsPayload) {
  try {
    return await authenticatedApiRequest<TestMailSettingsResponse>("/backoffice/mail-settings/test", {
      body: payload,
      method: "POST",
    });
  } catch (error) {
    throw new Error(parseBackofficeError(error, "Không thể gửi email thử."));
  }
}
