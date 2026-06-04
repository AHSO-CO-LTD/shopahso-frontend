import type { PromotionDiscountType, PromotionStatus } from "@/lib/promotion/types";

export function getPromotionStatusLabel(status: PromotionStatus | string) {
  switch (status) {
    case "DRAFT":
      return "Nháp";
    case "ACTIVE":
      return "Đang chạy";
    case "PAUSED":
      return "Tạm dừng";
    case "ENDED":
      return "Đã kết thúc";
    default:
      return status;
  }
}

export function getPromotionStatusClass(status: PromotionStatus | string) {
  switch (status) {
    case "ACTIVE":
      return "border-green-700 bg-green-600 text-white";
    case "PAUSED":
      return "border-yellow-600 bg-yellow-400 text-foreground";
    case "ENDED":
      return "border-border bg-muted text-muted-foreground";
    case "DRAFT":
    default:
      return "border-primary bg-primary text-primary-foreground";
  }
}

export function formatPromotionDate(value?: string | null) {
  if (!value) {
    return "Không giới hạn";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatPromotionRange(startsAt?: string | null, endsAt?: string | null) {
  return `${formatPromotionDate(startsAt)} - ${formatPromotionDate(endsAt)}`;
}

export function formatPromotionDiscount(type: PromotionDiscountType | string, value: string | number | null | undefined) {
  const numericValue = Number(value ?? 0);

  if (!Number.isFinite(numericValue)) {
    return type === "PERCENT" ? "0%" : "0 đ";
  }

  if (type === "PERCENT") {
    return `${numericValue}%`;
  }

  return numericValue.toLocaleString("vi-VN", {
    maximumFractionDigits: 0,
  }) + " đ";
}
