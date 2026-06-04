import type { PromotionDiscountType, PromotionStatus } from "@/lib/promotion/types";

export const PROMOTION_STATUS_OPTIONS: PromotionStatus[] = ["DRAFT", "ACTIVE", "PAUSED", "ENDED"];
export const PROMOTION_DISCOUNT_OPTIONS: PromotionDiscountType[] = ["PERCENT", "FIXED_AMOUNT"];

export function toDateTimeLocalValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 16);
}

export function toIsoDateTime(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function parsePositiveNumber(value: string) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : null;
}

export function validateImageFile(file: File) {
  if (!file.type.startsWith("image/")) {
    return "Vui lòng chọn đúng file hình ảnh dưới 8MB.";
  }

  if (file.size > 8 * 1024 * 1024) {
    return "Vui lòng chọn đúng file hình ảnh dưới 8MB.";
  }

  return null;
}

export function makeLocalPromotionItemId(variantId: string) {
  return `local-${variantId}-${Date.now()}`;
}

export function formatAdminMoney(value: string | number | null | undefined) {
  const numberValue = Number(value ?? 0);

  if (!Number.isFinite(numberValue)) {
    return "0 đ";
  }

  return numberValue.toLocaleString("vi-VN", {
    maximumFractionDigits: 0,
  }) + " đ";
}
