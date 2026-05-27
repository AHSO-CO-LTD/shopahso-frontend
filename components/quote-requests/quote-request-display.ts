import type { QuoteRequest, QuoteRequestStatus } from "@/lib/quote-request/types";

export const QUOTE_REQUEST_STATUSES: QuoteRequestStatus[] = ["PENDING", "QUOTED", "CANCELLED", "CLOSED"];

export function getQuoteRequestStatusLabel(status: QuoteRequestStatus | string) {
  switch (status) {
    case "PENDING":
      return "Đang chờ xử lý";
    case "QUOTED":
      return "Đã nhận xử lý";
    case "CANCELLED":
      return "Đã hủy";
    case "CLOSED":
      return "Đã đóng";
    default:
      return status;
  }
}

export function getQuoteRequestStatusClass(status: QuoteRequestStatus | string) {
  switch (status) {
    case "PENDING":
      return "border-yellow-500 bg-yellow-400 text-foreground";
    case "QUOTED":
      return "border-primary bg-primary text-primary-foreground";
    case "CLOSED":
      return "border-green-700 bg-green-600 text-primary-foreground";
    case "CANCELLED":
      return "border-destructive bg-destructive/10 text-destructive";
    default:
      return "border-border bg-muted/20 text-foreground";
  }
}

export function formatQuoteRequestDate(value?: string | null) {
  if (!value) {
    return "Chưa có";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Chưa có";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function getQuoteRequestProductName(request: QuoteRequest) {
  return request.product?.name || "Sản phẩm cần báo giá";
}

export function getQuoteRequestVariantName(request: QuoteRequest) {
  return request.variant?.name || request.variant?.sku || "Biến thể cần báo giá";
}

export function getQuoteRequestSku(request: QuoteRequest) {
  return request.variant?.sku || "N/A";
}
